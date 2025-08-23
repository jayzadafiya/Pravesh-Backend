import mongoose from "mongoose";
import { ICartEventTicket } from "../interfaces/venue-ticket.interface";
import UserTicketModel from "../models/User-ticket.model";
import { generateTicketId } from "../utils/helper-function";

class userTicketService {
  getAssignTickets = async (userId: mongoose.Types.ObjectId) => {
    const tickets: any = await UserTicketModel.find({
      user: userId,
    })
      .populate("event")
      .populate({
        path: "venue",
        select: "venue ticketTypes",
      })
      .lean();

    const cleanedTickets = tickets.map((ticket: any) => {
      const venue = ticket.venue as any;
      const ticketTypeDetails = venue?.ticketTypes?.find(
        (t: any) => t._id.toString() === ticket.ticketType.toString()
      );

      return {
        _id: ticket._id,
        status: ticket.status,
        quantity: ticket.quantity,
        price: ticket.price,
        createdAt: ticket.createdAt,
        event: {
          _id: ticket.event?._id,
          name: ticket.event?.name,
          startDate: ticket.event?.startDate,
          endDate: ticket.event?.endDate,
          posterImage: ticket.event?.mainImage,
          description: ticket.event?.description,
          duration: ticket.event?.duration,
        },
        venue: {
          _id: venue?._id,
          venue: venue?.venue,
        },
        ticketType: ticket.ticketType,
        ticketTypeDetails: ticketTypeDetails && {
          _id: ticketTypeDetails._id,
          type: ticketTypeDetails.type,
        },
      };
    });

    return cleanedTickets;
  };

  createTicket = async (
    userId: mongoose.Types.ObjectId,
    selectedTickets: ICartEventTicket[],
    status = "Pending"
  ) => {
    const ticketDocs = [];

    for (const venueTicket of selectedTickets) {
      for (const ticketType of venueTicket.ticketTypes) {
        if (!ticketType._id || !ticketType.quantity || !ticketType.count)
          continue;

        let ticketId = generateTicketId();

        ticketDocs.push({
          _id: ticketId,
          user: userId,
          event: venueTicket.eventId,
          venue: venueTicket._id,
          ticketType: ticketType._id,
          quantity: ticketType.count,
          price: ticketType.price,
          status,
        });
      }
    }

    if (ticketDocs.length > 0) {
      return await UserTicketModel.insertMany(ticketDocs);
    }
  };

  UpdateStatusAndTransaction = async (
    transactionId: mongoose.Types.ObjectId,
    ticketId: string
  ) => {
    return await UserTicketModel.findByIdAndUpdate(
      { _id: ticketId },
      { $set: { status: "Confirmed", transaction: transactionId } }
    );
  };
}

export const UserTicketService = new userTicketService();
