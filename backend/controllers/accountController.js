import User from "../models/userModel.js";

// ================= SUSPEND ACCOUNT =================
export const suspendAccount = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.isSuspended = true;
        await user.save();

        res.cookie("jwt", "", { maxAge: 0 });

        return res.status(200).json({
            message: "Account suspended"
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// ================= REACTIVATE ACCOUNT =================
export const reactivateAccount = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.isSuspended = false;
        await user.save();

        return res.status(200).json({
            message: "Account reactivated"
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal server error" });
    }
};