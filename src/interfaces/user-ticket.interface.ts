import mongoose from "mongoose";

export interface IUserTicket extends Document {
  _id: string;
  status: string;
  user: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  venue: mongoose.Types.ObjectId;
  ticketType: mongoose.Types.ObjectId;
  transaction?: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  checkedInAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
