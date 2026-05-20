import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("jwt", token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    // sameSite must be "lax" when not using HTTPS
    // "strict" or "none" with secure:true requires HTTPS
    sameSite: "lax",
    // secure:false because your EB URL is HTTP not HTTPS
    // Change to true only after you add SSL/HTTPS to your domain
    secure: false,
    path: "/",
  });
};