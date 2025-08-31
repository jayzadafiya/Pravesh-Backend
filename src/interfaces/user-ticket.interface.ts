import mongoose from "mongoose";

export interface IUserTicket extends Document {
  _id: string;
  status: string;
  user: mongoose.Types.ObjectId;
  mainUser: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  venue: mongoose.Types.ObjectId;
  ticketType: mongoose.Types.ObjectId;
  transaction?: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  checkedInAt?: Date;
  isTransferred: boolean;
  transferHistory: Array<{
    fromUser: mongoose.Types.ObjectId;
    toUser: mongoose.Types.ObjectId;
    transferredAt: Date;
    reason: "Split" | "Share" | "Transfer";
  }>;
  createdAt: Date;
  updatedAt: Date;
}
