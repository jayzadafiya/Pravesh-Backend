import { IEventTicket } from "../interfaces/event-ticket.interface";
import { IVenueTicket, ITicketType } from "../interfaces/venueTicket.interface";
import TicketModel from "../models/Event-ticket.model";
import VenueTicketModel from "../models/Venue-ticket.model";
import { BadRequestException } from "../utils/exceptions";
import { upsertOne } from "../utils/helper";

class eventTicketService {
  getEventTicketDetails = async (
    eventId: string
  ): Promise<{ eventTicket: IEventTicket; venueTickets: IVenueTicket[] }> => {
    const eventTicket = await TicketModel.findOne({ event: eventId }).populate(
      "event",
      "name"
    );
    if (!eventTicket) {
      throw new BadRequestException("Event ticket not found");
    }

    const venueTickets = await VenueTicketModel.find({
      eventTicket: eventTicket._id,
    });
    if (!venueTickets) {
      throw new BadRequestException("Venue tickets not found");
    }

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
      TicketModel,
      { event },
      { isMultiPlace, isDifferentPrice, generalPrice, generalQuantity }
    );
    if (!ticket) {
      throw new BadRequestException("Ticket not found");
    }
    return ticket;
  };

  createOrUpdateVenueTicket = async (
    eventTicket: string,
    venue: string,
    address: string,
    date: Date,
    ticketTypes: ITicketType[]
  ): Promise<IVenueTicket> => {
    const venueTicket = await upsertOne(
      VenueTicketModel,
      { eventTicket, venue, date },
      { eventTicket, venue, address, date, ticketTypes }
    );
    if (!venueTicket) {
      throw new BadRequestException("Venue ticket not found");
    }

    return venueTicket;
  };
}

export const EventTicketService = new eventTicketService();
