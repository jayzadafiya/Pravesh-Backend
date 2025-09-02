import mongoose from "mongoose";
import { IEventTicket } from "../interfaces/event-ticket.interface";
import {
  IVenueTicket,
  ITicketType,
  ICartEventTicket,
} from "../interfaces/venue-ticket.interface";
import EventTicketModel from "../models/Event-ticket.model";
import VenueTicketModel from "../models/Venue-ticket.model";
import { BadRequestException } from "../utils/exceptions";
import { getOne, upsertOne } from "../utils/helper";

class eventTicketService {
  getVenueTicketById = async (
    venueId: mongoose.Types.ObjectId
  ): Promise<IVenueTicket | null> => {
    return getOne(VenueTicketModel, venueId);
  };

  getEventTicketDetails = async (eventId: string) => {
    console.log(eventId);
    const eventTicket: any = (await EventTicketModel.findOne({
      event: new mongoose.Types.ObjectId(eventId),
    }).populate("event", "name")) as any;
    // if (!eventTicket) {
    //   throw new BadRequestException("Event ticket not found");
    // }

    let venueTickets = {};
    if (eventTicket) {
      venueTickets = await VenueTicketModel.find({
        eventTicket: eventTicket?._id,
      });
    }
    console.log(venueTickets);
    // if (!venueTickets) {
    //   throw new BadRequestException("Venue tickets not found");
    // }

    return { eventTicket, venueTickets };
  };

  createOrUpdateTicket = async (
    event: string,
    isMultiPlace: boolean,
    isDifferentPrice: boolean,
    generalPrice: number,
    generalQuantity: number
  ): Promise<IEventTicket> => {
    const ticket = await upsertOne(
      EventTicketModel,
      { event },
      { isMultiPlace, isDifferentPrice, generalPrice, generalQuantity }
    );
    if (!ticket) {
      throw new BadRequestException("Ticket not found");
    }
    return ticket;
  };

  createOrUpdateVenueTicket = async (
    _id: string | undefined,
    eventTicket: string,
    venue: string,
    address: string,
    date: string,
    ticketTypes: ITicketType[]
  ): Promise<IVenueTicket> => {
    console.log("Creating or updating venue ticket", {
      eventTicket,
      venue,
      date,
      _id,
    });
    if (!_id) {
      const newVenueTicket = new VenueTicketModel({
        eventTicket,
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
      { eventTicket, venue, address, date, ticketTypes }
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
