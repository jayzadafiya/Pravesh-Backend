import mongoose from "mongoose";

export interface ITicketType extends Document {
  _id: mongoose.Types.ObjectId;
  type: string;
  price: number;
  quantity: number;
  count?: number;
}

export interface IVenueTicket extends Document {
  _id: mongoose.Types.ObjectId;
  eventTicket: string;
  venue: string;
  address: string;
  date: Date;
  ticketTypes: ITicketType[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartEventTicket extends IVenueTicket {
  eventName: string;
  eventId: string;
}
