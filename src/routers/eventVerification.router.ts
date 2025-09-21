import * as express from "express";
import { EventVerificationController } from "../admin/controllers/eventVerification.controller";
import { body } from "express-validator";
import { validateRequest } from "../middleware/validate-request";
import adminProtect from "../middleware/admin-auth.middleware";

const eventVerificationRouter = express.Router();

eventVerificationRouter.use(adminProtect);

eventVerificationRouter.post(
  "/submit/:eventId",
  EventVerificationController.submitForVerification as any
);

eventVerificationRouter.get(
  "/pending",
  EventVerificationController.getPendingEvents as any
);

eventVerificationRouter.post(
  "/approve/:eventId",
  EventVerificationController.approveEvent as any
);

eventVerificationRouter.post(
  "/reject/:eventId",
  [
    body("message")
      .notEmpty()
      .withMessage("Rejection message is required")
      .isLength({ min: 10 })
      .withMessage("Rejection message must be at least 10 characters long"),
  ],
  validateRequest,
  EventVerificationController.rejectEvent as any
);

eventVerificationRouter.get(
  "/status/:eventId",
  EventVerificationController.getVerificationStatus as any
);

export default eventVerificationRouter;
