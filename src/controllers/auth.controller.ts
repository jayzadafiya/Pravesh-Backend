import * as jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Request, Response } from "express";
import { IUser } from "../interfaces/user.interface";
import { upsertOne } from "../utils/helper";
import UserModel from "../models/User.model";
import { BadRequestException, ForbiddenException } from "../utils/exceptions";

class authController {
  private signToken = (id: mongoose.Types.ObjectId) => {
    let jwtExpiresIn: any = process.env.JWT_EXPIRES_IN;

    if (!isNaN(Number(jwtExpiresIn))) {
      jwtExpiresIn = Number(jwtExpiresIn);
    }
    return jwt.sign({ id }, process.env.JWT_SECRET!, {
      expiresIn: jwtExpiresIn,
    });
  };

  private createSendToken = async (
    user: IUser,
    statusCode: number,
    res: Response
  ) => {
    const token = this.signToken(user._id);
    res.status(statusCode).json({
      status: "success",
      token,
      user,
    });
  };

  upsetUser = async (req: Request, res: Response) => {
    try {
      const data = req.body.phone;

      const user = await upsertOne(UserModel, { phone: data }, { phone: data });
      if (!user) {
        throw new BadRequestException("User not found");
      }

      if (!user.active) {
        throw new ForbiddenException(
          "User do not have access, Please contact admin"
        );
      }
      this.createSendToken(user!, 200, res);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  };
}
export const AuthController = new authController();
