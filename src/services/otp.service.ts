import UserModel from "../models/User.model";
import { EmailService } from "./email.service";
import mongoose from "mongoose";

class OTPService {
  private generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  sendOTPForTicketTransfer = async (email: string, phone: string) => {
    const otp = this.generateOTP();

    // Check if user exists
    let user = await UserModel.findOne({
      $or: [{ email }, { phone }],
    });

    if (user) {
      // Update existing user with OTP
      user.OTP = otp;
      await user.save();
    } else {
      // Create new user with minimal details
      user = new UserModel({
        email,
        phone,
        OTP: otp,
        emailVerified: false,
        active: false,
      });
      await user.save();
    }

    // Send OTP via email
    await EmailService.sendOTP(email, otp);

    return {
      userId: user._id,
      isNewUser: !user.active,
      message: "OTP sent successfully",
    };
  };

  verifyOTPForTicketTransfer = async (
    email: string,
    otp: string,
    firstName?: string,
    lastName?: string
  ) => {
    const user = await UserModel.findOne({ email, OTP: otp });

    if (!user) {
      throw new Error("Invalid OTP or email");
    }

    // Clear OTP and activate user
    user.OTP = undefined;
    user.emailVerified = true;
    user.active = true;

    // If it's a new user, update their details
    if (firstName && lastName) {
      user.firstName = firstName;
      user.lastName = lastName;
    }

    await user.save();

    return {
      userId: user._id,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      },
    };
  };

  resendOTP = async (email: string) => {
    const user = await UserModel.findOne({ email });

    if (!user) {
      throw new Error("User not found");
    }

    const otp = this.generateOTP();
    user.OTP = otp;
    await user.save();

    await EmailService.sendOTP(email, otp);

    return { message: "OTP resent successfully" };
  };
}

export const otpService = new OTPService();
