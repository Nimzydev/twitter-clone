import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";
import { OAuth2Client } from "google-auth-library";
import nodemailer from "nodemailer";
import crypto from "crypto";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Email transporter — uses Gmail App Password
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ================= GET ME =================
export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ================= SIGNUP =================
export const signUp = async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;

    if (!fullName || !username || !email || !password) {
      return res.status(400).json({ error: "Please provide all fields" });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    generateTokenAndSetCookie(newUser._id, res);

    return res.status(201).json(newUser);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Please enter all fields" });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isSuspended) {
      return res.status(403).json({ error: "Your account has been suspended" });
    }

    // Google-only accounts have no password
    if (!user.password) {
      return res.status(400).json({
        error: "This account uses Google Sign In. Please sign in with Google.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    generateTokenAndSetCookie(user._id, res);

    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ================= LOGOUT =================
export const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    return res.status(200).json({ message: "Logged out" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ================= GOOGLE LOGIN =================
// Verifies the Google credential token from the frontend,
// finds or creates the user, then sets the same JWT cookie
// as regular login so the rest of the app works identically
export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: "No Google credential provided" });
    }

    // Verify the token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    if (!email) {
      return res.status(400).json({ error: "Could not get email from Google" });
    }

    // Check if user already exists by email
    let user = await User.findOne({ email });

    if (user) {
      // Existing user — update their googleId if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }

      if (user.isSuspended) {
        return res.status(403).json({ error: "Your account has been suspended" });
      }
    } else {
      // New user — create account with Google details
      // Generate a unique username from their Google name
      const baseUsername = name
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 20);

      // Keep adding random numbers until username is unique
      let username = baseUsername;
      let counter = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = new User({
        fullName: name,
        username,
        email,
        googleId,
        // No password — Google users sign in with Google only
        password: "",
      });

      await user.save();
    }

    // Use the same cookie-based auth as regular login
    generateTokenAndSetCookie(user._id, res);

    return res.status(200).json(user);
  } catch (error) {
    console.log("Google login error:", error);
    return res.status(500).json({ error: "Google sign in failed" });
  }
};

// ================= FORGOT PASSWORD =================
// Sends a password reset email with a secure token link
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Please provide your email" });
    }

    const user = await User.findOne({ email });

    // Always return success even if email not found —
    // prevents email enumeration attacks
    if (!user) {
      return res.status(200).json({
        message: "If that email is registered you will receive a reset link shortly",
      });
    }

    // Google-only accounts cannot reset password
    if (user.googleId && !user.password) {
      return res.status(200).json({
        message: "If that email is registered you will receive a reset link shortly",
      });
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store hashed version in DB — never store raw tokens
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    // Token expires in 30 minutes
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000;

    await user.save();

    const FRONTEND_URL =
      process.env.FRONTEND_URL ||
      "http://localhost:5173";

    const resetLink = `${FRONTEND_URL}/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: `"X Clone" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Reset Your Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #1da1f2;">Reset Your Password</h2>
          <p>You requested a password reset for your X Clone account.</p>
          <p>Click the button below to reset your password. This link expires in 30 minutes.</p>
          
            href="${resetLink}"
            style="
              display: inline-block;
              background-color: #1da1f2;
              color: white;
              padding: 12px 24px;
              border-radius: 9999px;
              text-decoration: none;
              font-weight: bold;
              margin: 16px 0;
            "
          >
            Reset Password
          </a>
          <p style="color: #666; font-size: 14px;">
            If you did not request this, you can safely ignore this email.
            Your password will not change.
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      message: "If that email is registered you will receive a reset link shortly",
    });
  } catch (error) {
    console.log("Forgot password error:", error);
    return res.status(500).json({ error: "Failed to send reset email" });
  }
};

// ================= RESET PASSWORD =================
// Validates the token from the email link and updates the password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Please provide a new password" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Hash the token from the URL to compare with stored hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with matching token that has not expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        error: "Reset link is invalid or has expired. Please request a new one.",
      });
    }

    // Hash new password and save
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Clear the reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({ message: "Password reset successfully. You can now sign in." });
  } catch (error) {
    console.log("Reset password error:", error);
    return res.status(500).json({ error: "Password reset failed" });
  }
};