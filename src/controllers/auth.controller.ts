import * as jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Request, Response } from "express";
import { IUser } from "../interfaces/user.interface";
import { upsertOne } from "../utils/helper";
import UserModel from "../models/User.model";
import { BadRequestException, ForbiddenException } from "../utils/exceptions";
import { AuthService } from "../services/auth.service";
import { WhatsappService } from "../services/whatsapp.service";
import { QRService } from "../services/QR.service";
class authController {
  upsetUser = async (req: Request, res: Response) => {
    try {
      const phone = req.body.phone;
      const OTP = AuthService.createOtp();
      const user: any = await upsertOne(
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

      if (!user.qrCode) {
        user.qrCode = await QRService.generateQRCode(phone);
      }
      delete user.active;

      user.save();
      //TODO: Add whatsapp otp
      // WhatsappService.sendOTPMessage(OTP, phone);
      await AuthService.createSendToken(user, 200, res);
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };
}
export const AuthController = new authController();
