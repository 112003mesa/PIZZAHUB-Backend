import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
      type: String, 
      enum: ["user", "delivery", "admin"], 
      default: "user" 
    },
    
    // --- الإضافات الجديدة الخاصة بالديلفري ---
    
    status: { 
      type: String, 
      enum: ["idle", "delivering"], 
      default: "idle" 
    },
    
    // ربط المستخدم (المندوب) بالطلب الذي يقوم بتوصيله حالياً
    currentOrderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Order", // تأكد أن اسم موديل الطلبات عندك هو "Order"
      default: null 
    },

    // ---------------------------------------

    refreshToken: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);