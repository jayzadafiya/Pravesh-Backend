import * as jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Request, Response } from "express";
import { IUser } from "../interfaces/user.interface";
import { upsertOne } from "../utils/helper";
import UserModel from "../models/User.model";
import { BadRequestException, ForbiddenException } from "../utils/exceptions";
import { AuthService } from "../services/auth.service";
import { WhatsappService } from "../services/whatsapp.service";
class authController {
  upsetUser = async (req: Request, res: Response) => {
    try {
      const phone = req.body.phone;
      const OTP = AuthService.createOtp();
      const user = await upsertOne(
        UserModel,
        { phone },
        { phone, OTP },
        "+active"
      );

      if (!user) throw new BadRequestException("User not found");

      if (!user.active)
        throw new ForbiddenException(
          "User do not have access, Please contact admin"
        );

      delete user.active;

      // WhatsappService.sendOTPMessage(OTP, phone);
      res.status(200).json({
        status: "success",
        user,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  };
}
export const AuthController = new authController();
