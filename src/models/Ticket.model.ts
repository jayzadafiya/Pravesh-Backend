import mongoose, { Schema, Document } from "mongoose";

export interface ITicket extends Document {
  type: "Gold" | "Silver" | "Platinum" | string;
  status: "Active" | "Used" | "Refunded" | string;
  date: Date;
  userId: string;
  sharedWith?: string;
  qrCodeUrl?: string;
}

const TicketSchema: Schema = new Schema(
  {
    type: { type: String, required: true },
    status: { type: String, required: true, default: "Active" },
    date: { type: Date, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sharedWith: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
    toObject: {
      virtuals: true,
      versionKey: false,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

export default mongoose.model<ITicket>("ticket", TicketSchema);
