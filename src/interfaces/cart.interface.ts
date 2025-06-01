import mongoose from "mongoose";

export interface ICartItem {
  ticket: mongoose.Types.ObjectId;
  quantity: number;
}

export interface IVenueCartItem {
  venueId: mongoose.Types.ObjectId;
  tickets: {
    [ticketId: string]: number;
  };
}

export interface ICart extends Document {
  _id: mongoose.Types.ObjectId;
  items: IVenueCartItem[];
}
