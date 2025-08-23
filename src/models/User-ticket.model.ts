import mongoose, { Schema, Document } from "mongoose";
import { IUserTicket } from "../interfaces/user-ticket.interface";

const UserTicketSchema: Schema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "Pending",
      enum: ["Pending", "Confirmed", "Cancelled", "Refunded"],
    },
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
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VenueTicket",
      index: true,
      required: true,
    },
    ticketType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TicketType",
      required: true,
      index: true,
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      index: true,
    },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    checkedInAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

UserTicketSchema.index({ user: 1, event: 1 });
UserTicketSchema.index({ transaction: 1, status: 1 });

export default mongoose.model<IUserTicket>("UserTicket", UserTicketSchema);
