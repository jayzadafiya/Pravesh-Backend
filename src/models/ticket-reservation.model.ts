import mongoose, { Schema, Document } from "mongoose";
import { ITicketReservation } from "../interfaces/ticket-reservation.interface";

const TicketReservationSchema: Schema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VenueTicket",
      required: true,
      index: true,
    },
    ticketTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    reservedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["reserved"],
      default: "reserved",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
TicketReservationSchema.index({ venueId: 1, ticketTypeId: 1, status: 1 });
TicketReservationSchema.index({ orderId: 1, userId: 1 });
TicketReservationSchema.index({ expiresAt: 1, status: 1 });

// TTL index to automatically remove expired documents after 10 minutes
TicketReservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 600 });

export default mongoose.model<ITicketReservation>(
  "TicketReservation",
  TicketReservationSchema
);
