import * as express from "express";
import { OrganizationController } from "../controllers/organization.controller";
import protect from "../middleware/auth.middleware";
import { upload } from "../config/multer.config";
import { AdminEventController } from "../admin/controllers/event.controller";
import { getAllUserStats, getAllUsersWithTickets } from "../admin/controllers/user.controllers";

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
organizationRouter.get("/event/:id", AdminEventController.getEvent);

organizationRouter.get("/get-event-list", AdminEventController.getAllEvents);

//TODO: Add admin role auth
organizationRouter.post(
  "/",
  protect,
  OrganizationController.createOrganization as any
);

organizationRouter.post(
  "/create-event",
  upload.fields([
    { name: "posterImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
    { name: "mainImage", maxCount: 1 },
  ]),
  OrganizationController.createEvent
);

organizationRouter.put(
  "/event-artist/:eventId",
  upload.single("profileImage"),
  OrganizationController.updateOrCreateArtist
);

organizationRouter.put(
  "/event-sponsors/:eventId",
  upload.single("profileImage"),
  OrganizationController.updateOrCreateSponsors
);

organizationRouter.put(
  "/event-partners/:eventId",
  upload.single("profileImage"),
  OrganizationController.updateOrCreatePartners
);

organizationRouter.patch(
  "/update-event/:eventId",
  upload.fields([
    { name: "posterImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
    { name: "mainImage", maxCount: 1 },
  ]),
  OrganizationController.updateEvent
);

organizationRouter.delete(
  "/event-artist/:eventId/:artistId",
  AdminEventController.removeArtistById as any
);

organizationRouter.delete(
  "/event-sponsors/:eventId/:sponsorId",
  AdminEventController.removeSponsorById as any
);

organizationRouter.delete(
  "/event-partners/:eventId/:partnerId",
  AdminEventController.removePartnerById as any
);

organizationRouter.get(
  "/user-tickets",
  getAllUsersWithTickets
);

organizationRouter.get(
  "/user-tickets-stats",
  getAllUserStats
);

export default organizationRouter;
