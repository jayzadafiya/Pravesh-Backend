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

export interface IPartner {
  name: string;
  profileImage: string;
  order: number;
}

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  organization: mongoose.Types.ObjectId;
  posterImage: string;
  bannerImage: string;
  mainImage: string;
  isPublished: boolean;
  isDeleted: boolean;
  eventPassword: string;
  createdAt?: Date;
  updatedAt?: Date;
  artists?: IArtist[];
  sponsors?: ISponsor[];
  partners?: IPartner[];
  status?: "upcoming" | "ongoing" | "completed";
}
