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
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    // Generic payment fields (works for both Razorpay and Cashfree)
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentId: {
      type: String,
    },
    signature: {
      type: String,
    },
    // Payment gateway identifier
    paymentGateway: {
      type: String,
      enum: ["razorpay", "cashfree"],
      required: true,
      default: "cashfree",
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

// Create compound index for better query performance
TransactionSchema.index({ paymentGateway: 1, orderId: 1 });

export default mongoose.model<ITransaction>("Transaction", TransactionSchema);
