import { NextFunction, Request, Response } from "express";
import { AuthRequest } from "../interfaces/auth-request.interface";
import { UnauthorizedException } from "../utils/exceptions";

export const checkRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authReq = req as AuthRequest;
      const user = authReq.user;

      if (!user) {
        throw new UnauthorizedException("User not authenticated");
      }

      // Check if user has Admin role or if their role is in allowed roles
      if (!allowedRoles.includes(user.role) && user.role !== "Admin") {
        throw new UnauthorizedException("Insufficient permissions");
      }

      next();
    } catch (error: any) {
      next(error);
    }
  };
};
