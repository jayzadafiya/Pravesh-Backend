import { Request, Response } from "express";
import { EventTicketService } from "../services/evetn-ticket.service";
import { BadRequestException } from "../utils/exceptions";
import mongoose from "mongoose";

class ticketController {
  upsertEventTicket = async (req: Request, res: Response) => {
    try {
      const {
        event,
        isMultiPlace,
        isDifferentPrice,
        generalPrice,
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
        generalQuantity
      );

      res.status(200).json({ data: updatedTicket });
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  upsertVenueTicket = async (req: Request, res: Response) => {
    try {
      const { eventTicket, venue, address, date, ticketTypes } = req.body;

      const updatedTicket = await EventTicketService.createOrUpdateVenueTicket(
        eventTicket,
        venue,
        address,
        date,
        ticketTypes
      );

      if (!(eventTicket && date && venue)) {
        throw new BadRequestException(
          "Event ticket, date and venue are required"
        );
      } else if (!mongoose.Types.ObjectId.isValid(eventTicket)) {
        throw new BadRequestException("Invalid Event Ticket ID format");
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

      const { eventTicket, venueTickets } =
        await EventTicketService.getEventTicketDetails(eventId);

      res.status(200).json({
        eventTicket,
        venueTickets,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };
}
export const TicketController = new ticketController();
