import * as jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Response } from "express";
import { IUser } from "../interfaces/user.interface";

class authService {
  signToken = (
    id: mongoose.Types.ObjectId,
    jwtExpiresIn: any = process.env.JWT_EXPIRES_IN || "1d"
  ) => {
    return jwt.sign({ id }, process.env.JWT_SECRET!, {
      expiresIn: jwtExpiresIn,
    });
  };
  createSendToken = async (user: IUser, statusCode: number, res: Response) => {
    const token = this.signToken(user.id);
    res.status(statusCode).json({
      status: "success",
      token,
      user,
    });
  };

  verifyToken = (token: string) => {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      return null;
    }
  };
  createOtp = () => {
    return Math.floor(100000 + Math.random() * 900000);
  };
}
export const AuthService = new authService();
