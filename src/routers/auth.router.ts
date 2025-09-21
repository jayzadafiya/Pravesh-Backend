import * as express from "express";
import { AuthController } from "../controllers/auth.controller";
import {
  validateLogin,
  validateOrganizationLogin,
  validateSetPassword,
  validateSendSetupEmail,
} from "../validations/auth.validation";
import { validateRequest } from "../middleware/validate-request";
import protect from "../middleware/auth.middleware";
import { AdminAuthController } from "../admin/controllers/auth.controller";
import adminProtect from "../middleware/admin-auth.middleware";

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
  "/login-organization",
  validateOrganizationLogin,
  validateRequest,
  AdminAuthController.loginOrganization
);

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

authRouter.post(
  "/send-setup-email",
  validateSendSetupEmail,
  validateRequest,
  AdminAuthController.sendSetupEmail
);

authRouter.post(
  "/set-password",
  validateSetPassword,
  validateRequest,
  AdminAuthController.setPassword
);

authRouter.get("/me", adminProtect, AdminAuthController.getMe);

export default authRouter;
