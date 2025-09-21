import mongoose from "mongoose";
import * as jwt from "jsonwebtoken";

class authAuthService {
  signToken = (
    id: mongoose.Types.ObjectId,
    jwtExpiresIn: any = process.env.JWT_EXPIRES_IN || "1d"
  ) => {
    return jwt.sign({ id }, process.env.JWT_SECRET!, {
      expiresIn: jwtExpiresIn,
    });
  };

  verifyToken = (token: string) => {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      return null;
    }
  };
}

export const AdminAuthService = new authAuthService();
