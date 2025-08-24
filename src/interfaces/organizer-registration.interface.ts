import { Document, Types } from "mongoose";

export interface IOrganizerRegistration extends Document {
  // Organizer Details
  organizerName: string;
  contactPersonName: string;
  mobileNumber: string;
  emailAddress: string;
  website?: string;
  socialMediaLinks?: string;

  // Event Details
  eventName: string;
  eventType: string;
  venueName: string;
  venueAddress: string;
  city: string;
  eventDate: Date;
  eventTime: string;
  expectedAudienceSize: string;

  // Contact Preferences
  preferredContactTime?: string;
  preferredContactDate?: Date;

  // Status and Tracking
  status: "pending" | "contacted" | "in_progress" | "completed" | "rejected";
  notes?: string;
  assignedTo?: Types.ObjectId; // Admin user who will handle this registration
  contactedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
