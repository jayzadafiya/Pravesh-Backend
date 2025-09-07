import { Request, Response } from "express";
import { AdminEventService } from "../services/event.service";
import mongoose from "mongoose";
import { BadRequestException } from "../../utils/exceptions";

class adminEventController {
  getEvent = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const event = await AdminEventService.getEvent(id);
      if (!event) throw new BadRequestException("Event not found");
      res.status(200).json(event);
    } catch (error: any) {
      console.error("Error fetching event:", error);
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  getEvents = async (req: Request, res: Response) => {
    try {
      const events = await AdminEventService.getEventList();
      res.status(200).json(events);
    } catch (error: any) {
      console.error("Error fetching events:", error);
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  removeArtistById = async (req: Request, res: Response) => {
    const { eventId, artistId } = req.params;

    try {
      const event = await AdminEventService.removeEntityById(
        new mongoose.Types.ObjectId(eventId),
        new mongoose.Types.ObjectId(artistId),
        "artist"
      );

      if (!event) return res.status(404).json({ message: "Event not found" });

      res.status(200).json({ message: "Artist removed", event });
    } catch (error: any) {
      console.error("Error removing artist:", error);
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  removeSponsorById = async (req: Request, res: Response) => {
    const { eventId, sponsorId } = req.params;

    try {
      const event = await AdminEventService.removeEntityById(
        new mongoose.Types.ObjectId(eventId),
        new mongoose.Types.ObjectId(sponsorId),
        "sponsor"
      );

      if (!event) return res.status(404).json({ message: "Event not found" });

      res.status(200).json({ message: "Sponsor removed", event });
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };
  removePartnerById = async (req: Request, res: Response) => {
    const { eventId, partnerId } = req.params;

    try {
      const event = await AdminEventService.removeEntityById(
        new mongoose.Types.ObjectId(eventId),
        new mongoose.Types.ObjectId(partnerId),
        "partner"
      );

      if (!event) return res.status(404).json({ message: "Event not found" });

      res.status(200).json({ message: "Partner removed", event });
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  getEventStats = async (req: Request, res: Response) => {
    try {
      const stats = await AdminEventService.getEventStats();
      res.status(200).json(stats);
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  getAllEvents = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await AdminEventService.getAllEventList(page, limit);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error fetching events:", error);
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  getTicketsAndRevenueChartData = async (req: Request, res: Response) => {
    try {
      const data = await AdminEventService.getTicketsAndRevenueChartData();
      res.status(200).json({ data });
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };
}

export const AdminEventController = new adminEventController();
