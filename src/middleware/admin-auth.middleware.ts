import OrganizationModel from "../models/Organization.model";
import * as jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import {
  BadRequestException,
  UnauthorizedException,
} from "../utils/exceptions";
import { AdminAuthRequest } from "../interfaces/admin-auth-request.interface";
import { decryptOrgId } from "../utils/encryption";
import mongoose from "mongoose";

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

    const orgContextHeader = req.headers["x-organization-context"] as string;
    let contextOrganization = organization;
    console.log(
      "Organization from token:",
      organization.role,
      orgContextHeader
    );
    if (orgContextHeader && organization.role === "superAdmin") {
      try {
        const decryptedOrgId = decryptOrgId(orgContextHeader);

        const targetOrg = await OrganizationModel.findById(
          new mongoose.Types.ObjectId(decryptedOrgId)
        );
        console.log("Organization from token:", targetOrg?.name);

        if (targetOrg) {
          contextOrganization = targetOrg;
          console.log(
            `Super admin viewing organization: ${targetOrg.name} (${targetOrg._id})`
          );
        }
      } catch (error) {
        console.warn("Failed to decrypt organization context:", error);
      }
    }

    res.locals.organization = contextOrganization;
    (req as AdminAuthRequest).organization = contextOrganization;

    next();
  } catch (error: any) {
    next(error);
  }
};

export default adminProtect;
