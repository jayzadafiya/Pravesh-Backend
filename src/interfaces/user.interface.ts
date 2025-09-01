import mongoose from "mongoose";

export interface IUser extends Document {
  id: mongoose.Types.ObjectId;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  gender?: "Male" | "Female" | "Other";
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  role: "Admin" | "User";
  qrCode: string;
  active?: boolean;
  OTP?: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
  OTPRequestedAt?: Date;
  OTPRequestCount?: number;
  OTPRequestCountResetAt?: Date;
  emailVerified?: boolean;
}
