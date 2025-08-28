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
      enum: ["Pending", "Confirmed", "Cancelled", "Refunded", "Transferred"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    mainUser: {
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
    quantity: { type: Number, required: true, default: 1 },
    price: { type: Number, required: true },
    checkedInAt: { type: Date },
    isTransferred: { type: Boolean, default: false },
    transferHistory: [
      {
        fromUser: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        toUser: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        transferredAt: {
          type: Date,
          default: Date.now,
        },
        reason: {
          type: String,
          enum: ["Split", "Share", "Transfer"],
          default: "Transfer",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

UserTicketSchema.index({ user: 1, event: 1 });
UserTicketSchema.index({ transaction: 1, status: 1 });
UserTicketSchema.index({ mainUser: 1, status: 1 });
UserTicketSchema.index({ isTransferred: 1 });

export default mongoose.model<IUserTicket>("UserTicket", UserTicketSchema);
