import { Request, Response } from "express";
import { OrganizationService } from "../services/organization.service";
import { AuthRequest } from "../interfaces/auth-request.interface";
import { CloudinaryService } from "../services/cloudinary.service";
import slugify from "slugify";

class organizationController {
  createOrganization = async (req: AuthRequest, res: Response) => {
    try {
      const org = await OrganizationService.createOrganization(req.body);
      res.status(200).send(org);
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  createEvent = async (req: any, res: Response) => {
    try {
      const data = req.body;
      let posterImage = req.files?.["posterImage"]?.[0];
      let mainImages = req.files?.["bannerImage"]?.[0];

      if (posterImage) {
        posterImage = await CloudinaryService.uploadImage(
          posterImage.buffer,
          posterImage.originalname,
          "EventPoster"
        );
      }

      if (mainImages) {
        mainImages = await CloudinaryService.uploadImage(
          mainImages.buffer,
          mainImages.originalname,
          "EventPoster"
        );
      }

      const event = await OrganizationService.createEvent({
        ...data,
        posterImage: posterImage?.url,
        bannerImage: mainImages?.url,
        slug: slugify(data?.name, { lower: true, strict: true }),
      });
      console.log(event);
      res.status(200).send(event);
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  updateEvent = async (req: any, res: Response) => {
    try {
      const eventId = req.params.eventId;
      const data = req.body;

      let posterImage = req.files?.["posterImage"]?.[0];
      let mainImages = req.files?.["bannerImage"]?.[0];

      if (posterImage) {
        posterImage = await CloudinaryService.uploadImage(
          posterImage.buffer,
          posterImage.originalname,
          "EventPoster"
        );
        data.posterImage = posterImage?.url;
      }

      if (mainImages) {
        mainImages = await CloudinaryService.uploadImage(
          mainImages.buffer,
          mainImages.originalname,
          "EventBanner"
        );
        data.bannerImage = mainImages?.url;
      }

      if (data.name) {
        data.slug = slugify(data.name, { lower: true, strict: true });
      }
      const updatedEvent = await OrganizationService.updateEvent(eventId, data);

      res.status(200).send(updatedEvent);
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

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
      const events = await OrganizationService.getEventPosters();
      res.status(200).send(events);
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };
}

export const OrganizationController = new organizationController();
