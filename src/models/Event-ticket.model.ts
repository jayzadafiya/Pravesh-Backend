import mongoose, { Schema } from "mongoose";
import { IEventTicket } from "../interfaces/event-ticket.interface";

const EventTicketSchema: Schema = new Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
      unique: true,
    },
    isMultiPlace: { type: Boolean, default: false },
    isDifferentPrice: { type: Boolean, default: false },
    generalPrice: { type: Number },
    generalQuantity: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model<IEventTicket>("EventTicket", EventTicketSchema);
