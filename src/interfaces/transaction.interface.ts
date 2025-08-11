import mongoose from "mongoose";

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  // Generic payment fields (works for both Razorpay and Cashfree)
  orderId: string;
  paymentId?: string;
  signature?: string;
  // Payment gateway identifier
  paymentGateway: "razorpay" | "cashfree";
  amount: number;
  status: "process" | "paid" | "failed";
  method?: string;
  createdAt: Date;
  updatedAt: Date;
  currency: string;
  email?: string;
  contact?: string;
}
