import { Request, Response } from "express";
import { upsertOne } from "../utils/helper";
import UserModel from "../models/User.model";
import { BadRequestException, ForbiddenException } from "../utils/exceptions";
import { AuthService } from "../services/auth.service";
import { QRService } from "../services/QR.service";
class authController {
  upsetUser = async (req: Request, res: Response) => {
    try {
      const { phone, phonePrefix } = req.body;
      const OTP = AuthService.createOtp();
      const user: any = await upsertOne(
        UserModel,
        { phone },
        { phone, OTP, phonePrefix },
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
      const user: any = await UserModel.findOne({ phone });
      if (!user) throw new BadRequestException("User not found");
      if ("000000" !== otp) throw new ForbiddenException("Invalid OTP");

      user.OTP = null;
      await user.save();

      await AuthService.createSendToken(user, 200, res);
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };
}
export const AuthController = new authController();
