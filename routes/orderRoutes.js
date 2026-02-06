import express from "express";
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  getAvailableOrdersForDelivery,
  acceptOrderByDelivery,
  updateOrderStatusByDelivery,
  getOrderByIdForUser,
} from "../controllers/orderController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import isAdmin from "../middleware/isAdmin.js";
import roleMiddleware from "../middleware/roleMiddleware.js"

const router = express.Router();

router.post("/create", authMiddleware, createOrder);
router.get("/my", authMiddleware, getMyOrders);

router.get("/", authMiddleware, isAdmin, getAllOrders);
router.put("/:id/status", authMiddleware, isAdmin, updateOrderStatus);

router.get("/delivery/available", authMiddleware, roleMiddleware(["delivery"]), getAvailableOrdersForDelivery);

router.put( "/delivery/accept/:id", authMiddleware, roleMiddleware(["delivery"]), acceptOrderByDelivery);

router.put( "/delivery/status/:id", authMiddleware, roleMiddleware(["delivery"]), updateOrderStatusByDelivery);

router.get("/my/:id", authMiddleware, getOrderByIdForUser);



export default router;
