import mongoose from "mongoose";
import { ICartEventTicket } from "../interfaces/venue-ticket.interface";
import UserTicketModel from "../models/User-ticket.model";

class userTicketService {
  createTicket = async (
    userId: mongoose.Types.ObjectId,
    selectedTickets: ICartEventTicket[],
    status = "Pending"
  ) => {
    const ticketDocs = [];

    for (const venueTicket of selectedTickets) {
      for (const ticketType of venueTicket.ticketTypes) {
        if (!ticketType._id || !ticketType.quantity) continue;

        ticketDocs.push({
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
    ticketId: mongoose.Types.ObjectId
  ) => {
    return await UserTicketModel.findByIdAndUpdate(
      { _id: ticketId },
      { $set: { status: "Confirmed", transaction: transactionId } }
    );
  };
}

export const UserTicketService = new userTicketService();
