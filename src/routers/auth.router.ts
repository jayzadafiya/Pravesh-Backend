import * as express from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateLogin } from "../validations/auth.validation";
import { validateRequest } from "../middleware/validate-request";

const authRouter = express.Router();

authRouter.get("/verify", AuthController.verifyEmailToken);

authRouter.post(
  "/login",
  validateLogin,
  validateRequest,
  AuthController.upsetUser
);

authRouter.post("/verifyOTP", AuthController.verifyOtp);

export default authRouter;
