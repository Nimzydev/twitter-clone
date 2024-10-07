import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";

export const getMe = async (req,res) => {
    try {
        const user = await User.findById(req.user._id)
        return res.status(200).json(user);
        
    } catch (error) {
        console.log("Error in GetMe controller", error)
        return res.status(500).json({error: "Internal server error!"});
    }
}

export const signUp = async (req,res) => {
    try {
        const {fullName, username, email, password} = req.body;

        if (!fullName||!username||!email||!password||fullName ===""||username ===""||email ===""||password ==="") {
            return res.status(400).json({error: "Please provide all fields"});
        }

        const existingUsername = await User.findOne({username});
        if (existingUsername) {
            return res.status(400).json({error: "username already exists!"});
        }

        const existingEmail = await User.findOne({email});
        if (existingEmail) {
            return res.status(400).json({error: "email already exists!"});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            username,
            email,
            password:hashedPassword,
        });

        if (newUser) {
            generateTokenAndSetCookie(newUser._id,res);
            await newUser.save();
            
            return res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
                followers: newUser.followers,
                following: newUser.following,
                bio: newUser.bio,
                likedPosts: newUser.likedPosts,
                retweetPosts: newUser.retweetPosts,
            });

        }
 
    } catch (error) {
        console.log("Error in SignUp controller", error)
        return res.status(500).json({error: "Internal server error!"});
    }
}

export const login = async (req,res) => {
    try {
        const {username, password} = req.body;

        if (!username||!password||username ===""||password ==="") {
            return res.status(400).json({error: "Please enter all fields"});
        }

        const validUser = await User.findOne({username})
        if (!validUser) {
            return res.status(404).json({error: "Username not found!"});
        }

        const isPasswordCorrect = await bcrypt.compare(password, validUser?.password|| "");

        if ((!validUser && isPasswordCorrect) || (!isPasswordCorrect && validUser)) {
            return res.status(400).json({error: "Username or password is incorrect!"});
        }

    
        generateTokenAndSetCookie(validUser._id,res)

        return res.status(200).json({
                id: validUser._id,
                fullName: validUser.fullName,
                email: validUser.email,
                profilePic: validUser.profilePic,
                followers: validUser.followers,
                following: validUser.following,
                bio: validUser.bio,
                likedPosts: validUser.likedPosts,
                retweetPosts: validUser.retweetPosts,
            });
        
    } catch (error) {
        console.log("Error in Login controller", error)
        return res.status(500).json({error: "Internal server error!"})
    }
}

export const logout = async (req,res) => {
    try {
        res.cookie("jwt", "", {maxAge: 0});
        return res.status(200).json({message: "You have logged out successfully"});
        
    } catch (error) {
        console.log("Error in Logout controller", error)
        return res.status(500).json({error: "Internal server error!"})
    }
}

