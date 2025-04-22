import TicketModel from "../models/Ticket.model";
import { createOne } from "../utils/helper";

class ticketService {
  async createTicket(ticket: any) {
    return await createOne(TicketModel, ticket);
  }

  getTicketsByUserId = async (userId: string) => {
    try {
      const tickets = await TicketModel.find({ userId });
      return tickets;
    } catch (error) {
      console.error("Error fetching tickets:", error);
      throw error;
    }
  };
}

export const TicketService = new ticketService();
