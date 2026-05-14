import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
    suspendAccount,
    reactivateAccount
} from "../controllers/accountController.js";

const router = express.Router();

router.post("/suspend", protectRoute, suspendAccount);
router.post("/reactivate", protectRoute, reactivateAccount);

export default router;