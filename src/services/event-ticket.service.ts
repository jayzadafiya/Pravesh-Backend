import mongoose from "mongoose";
import {
  IVenueTicket,
  ITicketType,
  ICartEventTicket,
} from "../interfaces/venue-ticket.interface";
import VenueTicketModel from "../models/Venue-ticket.model";
import { BadRequestException } from "../utils/exceptions";
import { getOne, upsertOne } from "../utils/helper";

class eventTicketService {
  getVenueTicketById = async (
    venueId: mongoose.Types.ObjectId
  ): Promise<IVenueTicket | null> => {
    return getOne(VenueTicketModel, venueId);
  };

  getEventVenueTickets = async (eventId: string) => {
    console.log(eventId);
    const venueTickets = await VenueTicketModel.find({
      event: new mongoose.Types.ObjectId(eventId),
    });
    return { venueTickets };
  };

  // Event ticket is now removed, venue tickets connect directly to events
  // This method is kept for backward compatibility but just returns basic info
  createOrUpdateTicket = async (
    event: string,
    isMultiPlace: boolean,
    isDifferentPrice: boolean,
    generalPrice: number,
    onwardPrice: number,
    generalQuantity: number
  ): Promise<{ event: string; [key: string]: any }> => {
    // Just return basic info since EventTicket model is removed
    return {
      event,
      isMultiPlace,
      isDifferentPrice,
      generalPrice,
      onwardPrice,
      generalQuantity,
    };
  };

  createOrUpdateVenueTicket = async (
    _id: string | undefined,
    event: string,
    venue: string,
    address: string,
    date: string,
    ticketTypes: ITicketType[]
  ): Promise<IVenueTicket> => {
    console.log("Creating or updating venue ticket", {
      event,
      venue,
      date,
      _id,
    });
    if (!_id) {
      const newVenueTicket = new VenueTicketModel({
        event,
        venue,
        address,
        date,
        ticketTypes,
      });

      const saved = await newVenueTicket.save();
      if (!saved) {
        throw new BadRequestException("Failed to create venue ticket");
      }

      return saved as IVenueTicket;
    }

    const venueTicket = await upsertOne(
      VenueTicketModel,
      { _id },
      { event, venue, address, date, ticketTypes }
    );
    if (!venueTicket) {
      throw new BadRequestException("Venue ticket not found");
    }

    return venueTicket;
  };

  getAvailableTicketsCount = async (venueTicketId: mongoose.Types.ObjectId) => {
    const data = await VenueTicketModel.findById(venueTicketId);
    if (!data?.ticketTypes?.length) {
      throw new BadRequestException("No ticket types available for this venue");
    }

    return data.ticketTypes.reduce((acc, ticketType) => {
      acc[ticketType._id.toString()] = ticketType;
      return acc;
    }, {} as { [ticketId: string]: ITicketType });
  };

  decreaseRemainingCount = async (
    venueTicketId: mongoose.Types.ObjectId,
    ticketTypeId: mongoose.Types.ObjectId,
    quantity: number
  ) => {
    const result = await VenueTicketModel.updateOne(
      {
        _id: venueTicketId,
        ticketTypes: {
          $elemMatch: {
            _id: ticketTypeId,
            quantity: { $gte: quantity },
          },
        },
      },
      {
        $inc: {
          "ticketTypes.$.quantity": -quantity,
        },
      }
    );

    if (result.modifiedCount === 0) {
      throw new Error("Not enough tickets available or ticket not found.");
    }

    return result;
  };

  increaseRemainingCount = async (
    venueTicketId: mongoose.Types.ObjectId,
    ticketTypeId: mongoose.Types.ObjectId,
    quantity: number
  ) => {
    const result = await VenueTicketModel.updateOne(
      {
        _id: venueTicketId,
        "ticketTypes._id": ticketTypeId,
      },
      {
        $inc: {
          "ticketTypes.$.quantity": quantity,
        },
      }
    );

    if (result.modifiedCount === 0) {
      throw new Error("Ticket type not found or failed to increase count.");
    }

    return result;
  };
}

export const EventTicketService = new eventTicketService();
