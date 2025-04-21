import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "../interfaces/user.interface";

const UserSchema: Schema = new Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    role: { type: String, enum: ["Admin", "User"], default: "User" },
    active: { type: Boolean, default: true, select: false },
    OTP: { type: String, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
    toObject: {
      virtuals: true,
      versionKey: false,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

export default mongoose.model<IUser>("User", UserSchema);
