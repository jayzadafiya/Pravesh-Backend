import { Router } from "express";
import { OrganizerRegistrationController } from "../controllers/organizer-registration.controller";
import {
  createRegistrationValidation,
  updateStatusValidation,
  assignRegistrationValidation,
  addNotesValidation,
  getRegistrationsValidation,
  getRegistrationByIdValidation,
  validateDateRange,
} from "../validations/organizer-registration.validation";
import protect from "../middleware/auth.middleware";
import { checkRole } from "../middleware/role.middleware";

const router = Router();

router.post(
  "/register",
  createRegistrationValidation,
  OrganizerRegistrationController.createRegistration
);

router.get("/event-types", OrganizerRegistrationController.getEventTypes);

router.get("/audience-sizes", OrganizerRegistrationController.getAudienceSizes);

router.get(
  "/",
  // protect,
  // checkRole(["Admin"]),
  getRegistrationsValidation,
  validateDateRange,
  OrganizerRegistrationController.getRegistrations
);

router.get(
  "/stats",
  // protect,
  // checkRole(["Admin"]),
  OrganizerRegistrationController.getDashboardStats
);

router.get(
  "/export",
  // protect,
  // checkRole(["Admin"]),
  getRegistrationsValidation,
  validateDateRange,
  OrganizerRegistrationController.exportRegistrations
);

router.get(
  "/:id",
  // protect,
  // checkRole(["Admin"]),
  getRegistrationByIdValidation,
  OrganizerRegistrationController.getRegistrationById
);

router.patch(
  "/:id/status",
  // protect,
  // checkRole(["Admin"]),
  updateStatusValidation,
  OrganizerRegistrationController.updateRegistrationStatus
);

router.patch(
  "/:id/assign",
  // protect,
  // checkRole(["Admin"]),
  assignRegistrationValidation,
  OrganizerRegistrationController.assignRegistration
);

router.patch(
  "/:id/notes",
  // protect,
  // checkRole(["Admin"]),
  addNotesValidation,
  OrganizerRegistrationController.addNotes
);

export default router;
