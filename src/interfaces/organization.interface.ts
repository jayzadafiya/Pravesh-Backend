import mongoose, { Document } from "mongoose";

export interface IOrganization extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  logoUrl?: string;
  email: string;
  password?: string;
  role: "organization" | "superAdmin";
  emailVerified: boolean;
  active: boolean;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}
