import { Router } from "express";
import {
  addContributor,
  verifyContributor,
  loginContributor,
  getEventContributors,
  updateContributorStatus,
  removeContributorFromEvent,
  resendVerificationEmail,
  getContributorEvents,
} from "../controllers/contributor.controller";
import authMiddleware from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate-request";
import {
  validateAddContributor,
  validateVerifyContributor,
  validateContributorLogin,
  validateContributorId,
  validateEventId,
  validateUpdateStatus,
  validateRemoveFromEvent,
  validateResendEmail,
} from "../validations/contributor.validation";

const router = Router();

// Public routes (no authentication required)
router.get(
  "/verify",
  validateVerifyContributor,
  validateRequest,
  verifyContributor
);
router.post(
  "/login",
  validateContributorLogin,
  validateRequest,
  loginContributor
);

// Protected routes (authentication required)
router.post(
  "/",
  //   authMiddleware,
  validateAddContributor,
  validateRequest,
  addContributor
);
router.get(
  "/event/:eventId",
  //   authMiddleware,
  validateEventId,
  validateRequest,
  getEventContributors
);
router.get(
  "/events/:email",
  //   authMiddleware,
  validateRequest,
  getContributorEvents
);
router.patch(
  "/:contributorId/status",
  //   authMiddleware,
  validateUpdateStatus,
  validateRequest,
  updateContributorStatus
);
router.delete(
  "/:contributorId/remove",
  //   authMiddleware,
  validateRemoveFromEvent,
  validateRequest,
  removeContributorFromEvent
);
router.post(
  "/:contributorId/resend-email",
  //   authMiddleware,
  validateResendEmail,
  validateRequest,
  resendVerificationEmail
);

export default router;
