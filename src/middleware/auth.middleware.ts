import UserModel from "../models/User.model";
import * as jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import {
  BadRequestException,
  UnauthorizedException,
} from "../utils/exceptions";
import { AuthRequest } from "../interfaces/auth-request.interface";

const protect = async (
  req: Request,
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
      throw new UnauthorizedException("You are not logged in!!");
    }

    const decoded: any = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
        if (err) {
          if (err.name === "TokenExpiredError") {
            return reject(
              new UnauthorizedException("Access token has expired")
            );
          }
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
    (req as AuthRequest).user = freshUser;

    next();
  } catch (error: any) {
    next(error);
  }
};
export default protect;
