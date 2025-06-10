import mongoose, { Schema, Document } from "mongoose";
import { ITransaction } from "../interfaces/transaction.interface";

const TransactionSchema: Schema = new Schema<ITransaction>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["process", "paid", "failed", "refunded"],
      default: "process",
    },
    method: {
      type: String,
    },
    email: {
      type: String,
    },
    contact: {
      type: String,
    },
    currency: {
      type: String,
      default: "INR",
    },
  },
  { timestamps: true }
);

export default mongoose.model<ITransaction>("Transaction", TransactionSchema);
