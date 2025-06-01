import * as express from "express";
import { OrganizationController } from "../controllers/organization.controller";
import protect from "../middleware/auth.middleware";
import { upload } from "../config/multer.config";

const organizationRouter = express.Router();

organizationRouter.get(
  "/get-event-banners",
  OrganizationController.getEventBanner
);

organizationRouter.get(
  "/get-event-posters",
  OrganizationController.getEventPosters
);

organizationRouter.get("/get-event/:slug", OrganizationController.getEvent);

//TODO: Add admin role auth
organizationRouter.post(
  "/",
  protect,
  OrganizationController.createOrganization as any
);

organizationRouter.post(
  "/create-event",
  protect,
  upload.fields([
    { name: "posterImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
    { name: "mainImage", maxCount: 1 },
  ]),
  OrganizationController.createEvent
);

organizationRouter.patch(
  "/update-event/:eventId",
  protect,
  upload.fields([
    { name: "posterImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
    { name: "mainImage", maxCount: 1 },
  ]),
  OrganizationController.updateEvent
);

//TODO: Add admin role auth
organizationRouter.post(
  "/",
  protect,
  OrganizationController.createOrganization as any
);

organizationRouter.post(
  "/create-event",
  protect,
  upload.fields([
    { name: "posterImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
    { name: "mainImage", maxCount: 1 },
  ]),
  OrganizationController.createEvent
);

organizationRouter.put(
  "/event-artist/:eventId",
  protect,
  upload.single("profileImage"),
  OrganizationController.updateOrCreateArtist
);

organizationRouter.put(
  "/event-sponsors/:eventId",
  protect,
  upload.single("profileImage"),
  OrganizationController.updateOrCreateSponsors
);

export default organizationRouter;
