import * as express from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateLogin } from "../validations/auth.validation";
import { validateRequest } from "../middleware/validate-request";
import protect from "../middleware/auth.middleware";

const authRouter = express.Router();

authRouter.get("/verify", AuthController.verifyEmailToken);

authRouter.post(
  "/login",
  validateLogin,
  validateRequest,
  AuthController.upsetUser
);

authRouter.post("/verifyOTP", AuthController.verifyOtp);

authRouter.post(
  "/resend-otp",
  validateLogin,
  validateRequest,
  AuthController.resendOtp
);

authRouter.post(
  "/resend-verification-email",
  protect,
  AuthController.sendResetEmail as any
);
export default authRouter;
