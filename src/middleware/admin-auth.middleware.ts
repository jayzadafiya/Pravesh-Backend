import OrganizationModel from "../models/Organization.model";
import * as jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import {
  BadRequestException,
  UnauthorizedException,
} from "../utils/exceptions";
import { AdminAuthRequest } from "../interfaces/admin-auth-request.interface";

const adminProtect = async (
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

    const organization = await OrganizationModel.findById(decoded.id);
    if (!organization) {
      throw new BadRequestException(
        "Organization belonging to this token does no longer exist"
      );
    }

    if (!organization.active) {
      throw new UnauthorizedException("Organization account is not active");
    }

    res.locals.organization = organization;
    (req as AdminAuthRequest).organization = organization;

    next();
  } catch (error: any) {
    next(error);
  }
};

export default adminProtect;
