import mongoose, { Schema, model, Types } from "mongoose";
import { IOrganizerRegistration } from "../interfaces/organizer-registration.interface";

const OrganizerRegistrationSchema: Schema = new Schema(
  {
    // Organizer Details
    organizerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    contactPersonName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
      match: [/^[+]?[0-9]{10,15}$/, "Please provide a valid mobile number"],
    },
    emailAddress: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    website: {
      type: String,
      trim: true,
    },
    socialMediaLinks: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // Event Details
    eventName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    eventType: {
      type: String,
      required: true,
    },
    venueName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    venueAddress: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    eventDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (date: Date) {
          return date > new Date();
        },
        message: "Event date must be in the future",
      },
    },
    eventTime: {
      type: String,
      required: true,
      match: [
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Please provide a valid time format (HH:MM)",
      ],
    },
    expectedAudienceSize: {
      type: String,
      required: true,
    },

    // Contact Preferences
    preferredContactTime: {
      type: String,
      enum: [
        "9:00 AM - 12:00 PM",
        "12:00 PM - 3:00 PM",
        "3:00 PM - 6:00 PM",
        "6:00 PM - 9:00 PM",
      ],
    },
    preferredContactDate: {
      type: Date,
      validate: {
        validator: function (date: Date) {
          return !date || date >= new Date();
        },
        message: "Preferred contact date cannot be in the past",
      },
    },

    // Status and Tracking
    status: {
      type: String,
      enum: ["pending", "contacted", "in_progress", "completed", "rejected"],
      default: "pending",
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
    assignedTo: {
      type: Types.ObjectId,
      ref: "User",
    },
    contactedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
OrganizerRegistrationSchema.index({ emailAddress: 1 });
OrganizerRegistrationSchema.index({ status: 1 });
OrganizerRegistrationSchema.index({ eventDate: 1 });
OrganizerRegistrationSchema.index({ city: 1 });
OrganizerRegistrationSchema.index({ eventType: 1 });
OrganizerRegistrationSchema.index({ createdAt: -1 });

// Compound index for admin queries
OrganizerRegistrationSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IOrganizerRegistration>(
  "OrganizerRegistration",
  OrganizerRegistrationSchema
);
