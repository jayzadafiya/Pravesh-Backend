import mongoose, { Schema, model, Types } from "mongoose";
import { IContributor } from "../interfaces/contributor.interface";

const ContributorSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    events: [
      {
        eventId: {
          type: Types.ObjectId,
          ref: "Event",
          required: true,
        },
        organizationId: {
          type: Types.ObjectId,
          ref: "Organization",
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "active", "inactive"],
          default: "pending",
        },
        verificationToken: {
          type: String,
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        isDeleted: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
// ContributorSchema.index({ email: 1 });
ContributorSchema.index({ "events.eventId": 1 });
ContributorSchema.index({ "events.organizationId": 1 });

export default mongoose.model<IContributor>("Contributor", ContributorSchema);
