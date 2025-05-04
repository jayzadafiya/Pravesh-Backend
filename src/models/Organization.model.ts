import mongoose, { Schema, model, Types } from "mongoose";
import { IOrganization } from "../interfaces/organization.interface";

const OrganizationSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      default: "",
    },
    logoUrl: {
      type: String,
      default: "",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IOrganization>(
  "Organization",
  OrganizationSchema
);
