import mongoose, { Document } from "mongoose";

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  date: Date;
  location?: string;
  organization: mongoose.Types.ObjectId;
  posterImage: string;
  bannerImage: string;
  isPublished: boolean;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
