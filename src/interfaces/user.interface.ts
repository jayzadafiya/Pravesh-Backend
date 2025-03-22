import mongoose from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  phone: string;
  role: "Admin" | "User";
  active: boolean;
}
