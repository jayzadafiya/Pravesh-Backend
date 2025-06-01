import mongoose, { Schema, Document } from "mongoose";
import { ICart } from "../interfaces/cart.interface";

const VenueCartSchema: Schema = new Schema(
  {
    venueId: {
      type: Schema.Types.ObjectId,
      ref: "VenueTicket",
    },
    tickets: {
      type: Map,
      of: {
        type: Number,
        min: 1,
      },
    },
  },
  { _id: false }
);

const CartSchema: Schema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [VenueCartSchema],
      required: false,
      default: [],
    },
  },
  {
    versionKey: false,
  }
);

export default mongoose.model<ICart>("Cart", CartSchema);
