import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { getPendingOrders, acceptOrder, updateOrderStatus, getDashboardStats, getMyDeliveries, getCurrentTrip} from "../controllers/deliveryController.js";

const router = express.Router();

// جلب الأوردرز اللي pending
router.get("/pending", authMiddleware, roleMiddleware(["delivery"]), getPendingOrders);

router.get("/dashboard/stats", authMiddleware, roleMiddleware(["delivery"]), getDashboardStats);

router.get("/my-deliveries", authMiddleware, roleMiddleware(["delivery"]), getMyDeliveries);

router.get("/my-current-trip", authMiddleware, roleMiddleware(["delivery"]), getCurrentTrip);
// قبول الأوردر
router.put("/accept/:id", authMiddleware, roleMiddleware(["delivery"]), acceptOrder);

// تحديث الحالة ("on_the_way", "delivered")
router.put("/status/:id", authMiddleware, roleMiddleware(["delivery"]), updateOrderStatus);

export default router;
