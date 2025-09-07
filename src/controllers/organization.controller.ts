import slugify from "slugify";
import { Request, Response } from "express";
import { OrganizationService } from "../services/organization.service";
import { AuthRequest } from "../interfaces/auth-request.interface";
import { CloudinaryService } from "../services/cloudinary.service";
import { BadRequestException } from "../utils/exceptions";
import { generateMixedRandomCode } from "../utils/helper-function";

class organizationController {
  getEventBanner = async (req: Request, res: Response) => {
    try {
      const events = await OrganizationService.getEventBanner();
      res.status(200).send(events);
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  getEventPosters = async (req: Request, res: Response) => {
    try {
      const events = await Promise.all([
        OrganizationService.getEventPosters(true),
        OrganizationService.getEventPosters(),
      ]);
      res.status(200).send(events);
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  getEvent = async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug;
      const event = await OrganizationService.getEvent(slug);

      res.status(200).send(event);
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  createOrganization = async (req: AuthRequest, res: Response) => {
    try {
      const org = await OrganizationService.createOrganization(req.body);
      res.status(201).send(org);
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  createEvent = async (req: any, res: Response) => {
    try {
      const data = req.body;
      const posterImage = await CloudinaryService.uploadImageIfExists(
        req.files?.["posterImage"]?.[0],
        "EventPoster"
      );
      const bannerImage = await CloudinaryService.uploadImageIfExists(
        req.files?.["bannerImage"]?.[0],
        "EventPoster"
      );
      const mainImage = await CloudinaryService.uploadImageIfExists(
        req.files?.["mainImage"]?.[0],
        "EventPoster"
      );

      if (posterImage) data.posterImage = posterImage;
      if (bannerImage) data.bannerImage = bannerImage;
      if (mainImage) data.mainImage = mainImage;
      const event = await OrganizationService.createEvent({
        ...data,
        eventPassword: generateMixedRandomCode(),
        slug: slugify(data?.name, { lower: true, strict: true }),
      });
      res.status(201).send(event);
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  updateEvent = async (req: any, res: Response) => {
    try {
      const eventId = req.params.eventId;
      const data = req.body;
      const posterImage = await CloudinaryService.uploadImageIfExists(
        req.files?.["posterImage"]?.[0],
        "EventPoster"
      );
      const bannerImage = await CloudinaryService.uploadImageIfExists(
        req.files?.["bannerImage"]?.[0],
        "EventPoster"
      );
      const mainImage = await CloudinaryService.uploadImageIfExists(
        req.files?.["mainImage"]?.[0],
        "EventPoster"
      );

      if (posterImage) data.posterImage = posterImage;
      if (bannerImage) data.bannerImage = bannerImage;
      if (mainImage) data.mainImage = mainImage;

      if (data.name) {
        data.slug = slugify(data.name, { lower: true, strict: true });
      }
      const updatedEvent = await OrganizationService.updateEvent(eventId, data);

      res.status(200).send(updatedEvent);
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  private async upsertEntity(
    req: Request,
    res: Response,
    type: "artist" | "sponsor" | "partner"
  ) {
    try {
      const { eventId } = req.params;
      const name = req.body.name;
      const order = Number(req.body.order);

      if (!name || isNaN(order)) {
        throw new BadRequestException("Missing or invalid fields: name, order");
      }

      let profileImage = req.body.profileImage;
      if (req.file) {
        const uploaded = await CloudinaryService.uploadImageIfExists(
          req.file,
          "Artists and Sponsors"
        );
        if (uploaded) profileImage = uploaded;
      }

      if (!profileImage) {
        throw new BadRequestException("Profile image is required");
      }

      const payload = { name, profileImage, order };

      let updatedList;
      if (type === "artist") {
        updatedList = await OrganizationService.upsertEntity(
          eventId,
          payload,
          "artists"
        );
      } else if (type === "partner") {
        updatedList = await OrganizationService.upsertEntity(
          eventId,
          payload,
          "partners"
        );
      } else {
        updatedList = await OrganizationService.upsertEntity(
          eventId,
          payload,
          "sponsors"
        );
      }

      res.status(200).send({
        message: `${
          type[0].toUpperCase() + type.slice(1)
        } added/updated successfully`,
        [type === "artist"
          ? "artists"
          : type === "partner"
          ? "partners"
          : "sponsors"]: updatedList,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  }

  updateOrCreateArtist = async (req: Request, res: Response) => {
    return this.upsertEntity(req, res, "artist");
  };

  updateOrCreateSponsors = async (req: Request, res: Response) => {
    return this.upsertEntity(req, res, "sponsor");
  };

  updateOrCreatePartners = async (req: Request, res: Response) => {
    return this.upsertEntity(req, res, "partner");
  };

  getEventPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { eventId } = req.params;
      const result = await OrganizationService.getEventPassword(eventId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error retrieving event password:", error);

      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to retrieve event password",
      });
    }
  };

  getEventTicketsDetails = async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const result = await OrganizationService.getEventTicketsDetails(eventId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error retrieving event tickets details:", error);

      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to retrieve event tickets details",
      });
    }
  };
}

export const OrganizationController = new organizationController();
