import * as express from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateLogin } from "../validations/auth.validation";
import { validateRequest } from "../middleware/validate-request";

const authRouter = express.Router();

authRouter.post(
  "/login",
  validateLogin,
  validateRequest,
  AuthController.upsetUser
);

export default authRouter;
