import mongoose from "mongoose";
import { Request, Response } from "express";
import { EventTicketService } from "../services/event-ticket.service";
import { BadRequestException } from "../utils/exceptions";
import moment from "moment";

class ticketController {
  upsertEventTicket = async (req: Request, res: Response) => {
    try {
      const {
        event,
        isMultiPlace,
        isDifferentPrice,
        generalPrice,
        onwardPrice,
        generalQuantity,
      } = req.body;

      if (!event) {
        throw new BadRequestException("Event is required");
      } else if (!mongoose.Types.ObjectId.isValid(event)) {
        throw new BadRequestException("Invalid Event ID format");
      }

      const updatedTicket = await EventTicketService.createOrUpdateTicket(
        event,
        isMultiPlace,
        isDifferentPrice,
        generalPrice,
        onwardPrice,
        generalQuantity
      );

      res.status(200).json({ data: updatedTicket });
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  upsertVenueTicket = async (req: Request, res: Response) => {
    try {
      const { event, venue, address, date, ticketTypes, _id } = req.body;

      const updatedTicket = await EventTicketService.createOrUpdateVenueTicket(
        _id,
        event,
        venue,
        address,
        moment(date).utc().startOf("day").format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
        ticketTypes
      );

      if (!(event && date && venue)) {
        throw new BadRequestException("Event, date and venue are required");
      } else if (!mongoose.Types.ObjectId.isValid(event)) {
        throw new BadRequestException("Invalid Event ID format");
      }

      res.status(200).json({ updatedTicket });
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  getEventTicketDetails = async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;

      if (!eventId) {
        throw new BadRequestException("Event ID is required");
      }

      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new BadRequestException("Invalid Event ID format");
      }

      const { venueTickets } = await EventTicketService.getEventVenueTickets(
        eventId
      );

      res.status(200).json({
        venueTickets,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };
}
export const TicketController = new ticketController();
