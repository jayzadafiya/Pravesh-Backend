import mongoose from "mongoose";

export interface ITicketReservation extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  orderId: string;
  venueId: mongoose.Types.ObjectId;
  ticketTypeId: mongoose.Types.ObjectId;
  quantity: number;
  reservedAt: Date;
  expiresAt: Date;
  status: "reserved";
  createdAt: Date;
  updatedAt: Date;
}
