import { Document, Types } from "mongoose";

export interface IContributorEvent {
  eventId: Types.ObjectId;
  organizationId: Types.ObjectId;
  status: "pending" | "active" | "inactive";
  verificationToken: string;
  addedAt: Date;
  isDeleted: boolean;
}

export interface IContributor extends Document {
  email: string;
  events: IContributorEvent[];
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
