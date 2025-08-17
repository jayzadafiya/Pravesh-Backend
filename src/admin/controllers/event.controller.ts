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

  getAllEvents = async (req: Request, res: Response) => {
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
      const event = await AdminEventService.removeArtistAndSponsorById(
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
      const event = await AdminEventService.removeArtistAndSponsorById(
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
}

export const AdminEventController = new adminEventController();
