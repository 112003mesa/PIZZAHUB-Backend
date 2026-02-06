import express from "express";
import { getDashboardStats } from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import isAdmin from "../middleware/isAdmin.js";

const router = express.Router();

router.get("/dashboard", authMiddleware, isAdmin, getDashboardStats);

export default router;
