import mongoose from "mongoose";

export interface IOrganization extends Document {
  _id?: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  logoUrl?: string;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
