import UserModel from "../models/User.model";
import * as jwt from "jsonwebtoken";
import { NextFunction, Response } from "express";
import { AuthRequest } from "../interfaces/auth-request.interface";
import { BadRequestException } from "../utils/exceptions";

const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new BadRequestException("You are not logged in!!");
    }

    const decoded: any = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
        if (err) {
          return reject(err);
        }
        resolve(decoded);
      });
    });

    const freshUser = await UserModel.findById(decoded.id);
    if (!freshUser) {
      throw new BadRequestException(
        "User belonging to this token does no longer exist"
      );
    }

    res.locals.user = freshUser;
    req.user = freshUser;

    next();
  } catch (error: any) {
    next(error);
  }
};
export default protect;
