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
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
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
    mainImage: {
      type: String,
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    duration: {
      type: String,
    },
    artists: [
      {
        name: { type: String, required: true },
        profileImage: { type: String, required: true },
        order: { type: Number, required: true },
      },
    ],
    sponsors: [
      {
        name: { type: String, required: true },
        profileImage: { type: String, required: true },
        order: { type: Number, required: true },
      },
    ],
    partners: [
      {
        name: { type: String, required: true },
        profileImage: { type: String, required: true },
        order: { type: Number, required: true },
      },
    ],
    eventPassword: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

EventSchema.virtual("status").get(function (this: any) {
  const now = new Date();
  if (now < this.startDate) return "upcoming";
  if (now >= this.startDate && now <= this.endDate) return "ongoing";
  return "completed";
});

EventSchema.set("toJSON", { virtuals: true });
EventSchema.set("toObject", { virtuals: true });

export default mongoose.model<IEvent>("Event", EventSchema);
