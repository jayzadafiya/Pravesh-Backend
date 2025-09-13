import mongoose, { Schema } from "mongoose";
import { IVenueTicket } from "../interfaces/venue-ticket.interface";

const TicketTypeSchema = new Schema(
  {
    type: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    totalTicket: { type: Number },
  },
  {
    versionKey: false,
  }
);

const VenueTicketSchema: Schema = new Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    venue: { type: String, required: true },
    address: { type: String, required: true },
    date: { type: Date, required: true },
    ticketTypes: [TicketTypeSchema],
  },
  {
    versionKey: false,
  }
);

VenueTicketSchema.index({ event: 1, venue: 1, date: 1 }, { unique: true });

export default mongoose.model<IVenueTicket>("VenueTicket", VenueTicketSchema);
