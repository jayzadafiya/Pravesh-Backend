import mongoose, { Document } from "mongoose";

export interface IArtist {
  name: string;
  profileImage: string;
  order: number;
}

export interface ISponsor {
  name: string;
  profileImage: string;
  order: number;
}

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
  mainImage: string;
  isPublished: boolean;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  artists?: IArtist[];
  sponsors?: ISponsor[];
}
