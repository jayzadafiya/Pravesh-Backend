import * as express from "express";
import { OrganizationController } from "../controllers/organization.controller";
import protect from "../middleware/auth.middleware";
import { upload } from "../config/multer.config";

const organizationRouter = express.Router();

//TODO: Add admin role auth
organizationRouter.post(
  "/",
  protect,
  OrganizationController.createOrganization
);

organizationRouter.post(
  "/create-event",
  protect,
  upload.fields([
    { name: "posterImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
  ]),
  OrganizationController.createEvent
);

organizationRouter.patch(
  "/update-event/:eventId",
  protect,
  upload.fields([
    { name: "posterImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
  ]),
  OrganizationController.updateEvent
);

export default organizationRouter;
