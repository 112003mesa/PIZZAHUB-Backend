import express from "express";
import { createProduct, getProducts, deleteProduct, updateProduct, getBestSellers, getDeliveryStaff} from "../controllers/productController.js";
import isAdmin from "../middleware/isAdmin.js";
import upload from "../middleware/upload.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getProducts);
router.get("/best-sellers", authMiddleware, getBestSellers);
router.post("/create", authMiddleware, isAdmin, upload.single("image"), createProduct);
router.get("/delivery-staff", authMiddleware, isAdmin, getDeliveryStaff);
router.put("/update/:id", authMiddleware, isAdmin, upload.single("image"), updateProduct);
router.delete("/delete/:id", authMiddleware, isAdmin, deleteProduct);

export default router;