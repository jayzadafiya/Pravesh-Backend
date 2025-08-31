import { Request, Response } from "express";
import { upsertOne } from "../utils/helper";
import UserModel from "../models/User.model";
import { BadRequestException, ForbiddenException } from "../utils/exceptions";
import { AuthService } from "../services/auth.service";
import { QRService } from "../services/QR.service";
import { AwsSNSService } from "../services/awsSNS.service";
import { AuthRequest } from "../interfaces/auth-request.interface";
import { UserService } from "../services/user.service";
import { EmailService } from "../services/email.service";
import { WhatsappService } from "../services/whatsapp.service";
class authController {
  upsetUser = async (req: Request, res: Response) => {
    try {
      const { phone, phonePrefix } = req.body;
      if (!phone || !phonePrefix)
        throw new BadRequestException("Phone and phone prefix are required");

      if (phone.length > 10) {
        throw new BadRequestException(
          "Phone number should not exceed 10 digits"
        );
      }
      const OTP = +AuthService.createOtp();
      // Check existing user for recent OTP request
      const existingUser: any = await UserModel.findOne({ phone }).select(
        "+OTPRequestedAt"
      );

      if (existingUser && existingUser.OTPRequestedAt) {
        const diff =
          Date.now() - new Date(existingUser.OTPRequestedAt).getTime();
        if (diff < 60_000) {
          throw new BadRequestException(
            "OTP already sent. Please wait for 1 minute before requesting again."
          );
        }
      }

      const user: any = await upsertOne(
        UserModel,
        { phone },
        { phone, OTP, phonePrefix, OTPRequestedAt: new Date() },
        "+active"
      );

      if (!user) throw new BadRequestException("User not found");

      if (!user.active)
        throw new ForbiddenException(
          "User do not have access, Please contact admin"
        );

      if (!user.qrCode) {
        user.qrCode = await QRService.generateQRCode(user.id);
      }
      delete user.active;

      user.save();

      if (process.env.MAIN_ENVIRONMENT !== "development") {
        // await AwsSNSService.sendOtpSMS(
        //   `+${phonePrefix}${phone}`,
        //   OTP.toString()
        // );

        await WhatsappService.sendOTPMessage(OTP, phone);
      }
      res.status(200).json({
        sendOtp: true,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };
  verifyOtp = async (req: Request, res: Response) => {
    try {
      const { phone, otp } = req.body;
      const user: any = await UserModel.findOne({ phone }).select(
        "+OTP +OTPRequestedAt"
      );
      if (!user) throw new BadRequestException("User not found");

      // Verify OTP exists and is not expired (1 minute)
      if (!user.OTP) throw new ForbiddenException("Invalid or expired OTP");

      const requestedAt = user.OTPRequestedAt
        ? new Date(user.OTPRequestedAt).getTime()
        : 0;
      const age = Date.now() - requestedAt;
      if (age > 60_000) {
        // OTP expired
        user.OTP = null;
        user.OTPRequestedAt = null;
        await user.save();
        throw new ForbiddenException("OTP expired. Please request a new one.");
      }

      if (process.env.MAIN_ENVIRONMENT !== "development") {
        if (+user.OTP !== +otp) throw new ForbiddenException("Invalid OTP");
      }

      user.OTP = null;
      user.OTPRequestedAt = null;
      await user.save();

      await AuthService.createSendToken(user, 200, res);
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  sendResetEmail = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestException("User ID is required");
      }

      const user = (await UserService.getUserById(userId)) as any;
      if (!user) {
        throw new BadRequestException("User not found");
      }

      user.emailVerified = false;
      const JWTToken = await AuthService.signToken(userId, "5m");
      await EmailService.sendAuthEmail(user.email!, JWTToken);
      await user.save();
      res.status(200).json(user);
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  verifyEmailToken = async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res.redirect(
          `${process.env.FRONTEND_URL}/verified?error=${encodeURIComponent(
            "Token is required"
          )}`
        );
      }

      const decoded: any = AuthService.verifyToken(token);

      console.log("Decoded token:", decoded);
      if (!decoded) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/verified?error=${encodeURIComponent(
            "Invalid or expired token"
          )}`
        );
      }

      const user = await UserModel.findById(decoded.id);
      if (!user) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/verified?error=${encodeURIComponent(
            "User not found"
          )}`
        );
      }

      user.emailVerified = true;
      await user.save();
      return res.redirect(
        `${process.env.FRONTEND_URL}/verified?user=${decoded.id}`
      );
    } catch (error: any) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/verified?error=${encodeURIComponent(
          error.message
        )}`
      );
    }
  };
}
export const AuthController = new authController();
