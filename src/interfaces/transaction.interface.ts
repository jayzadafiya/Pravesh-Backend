import mongoose from "mongoose";

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  status: "process" | "paid" | "failed";
  method?: string;
  createdAt: Date;
  updatedAt: Date;
  currency: string;
  email?: string;
  contact?: string;
}
