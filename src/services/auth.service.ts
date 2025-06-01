import * as jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Request, Response } from "express";
import { IUser } from "../interfaces/user.interface";
import { upsertOne } from "../utils/helper";
import UserModel from "../models/User.model";
import { BadRequestException, ForbiddenException } from "../utils/exceptions";

class authService {
  private signToken = (id: mongoose.Types.ObjectId) => {
    let jwtExpiresIn: any = process.env.JWT_EXPIRES_IN;

    if (!isNaN(Number(jwtExpiresIn))) {
      jwtExpiresIn = Number(jwtExpiresIn);
    }
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

  createOtp = () => {
    return Math.floor(1000 + Math.random() * 9000);
  };
}
export const AuthService = new authService();
