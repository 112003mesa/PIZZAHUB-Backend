import express from "express";
import { checkout } from "../controllers/checkoutController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, checkout);

export default router;
