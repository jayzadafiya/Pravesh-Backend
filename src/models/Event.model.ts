import mongoose, { Schema, model, Types } from "mongoose";
import { IEvent } from "../interfaces/event.interface";

const EventSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      default: "",
    },
    organization: {
      type: Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    posterImage: {
      type: String,
      required: true,
    },
    bannerImage: {
      type: String,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IEvent>("Event", EventSchema);
