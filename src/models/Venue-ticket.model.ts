import mongoose, { Schema } from "mongoose";
import { IVenueTicket } from "../interfaces/venueTicket.interface";

const TicketTypeSchema = new Schema(
  {
    type: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
  },
  {
    versionKey: false,
  }
);

const VenueTicketSchema: Schema = new Schema(
  {
    eventTicket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventTicket",
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

VenueTicketSchema.index(
  { eventTicket: 1, venue: 1, date: 1 },
  { unique: true }
);

export default mongoose.model<IVenueTicket>("VenueTicket", VenueTicketSchema);
