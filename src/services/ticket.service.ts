import TicketModel from "../models/Ticket.model";
import { createOne } from "../utils/helper";

class ticketService {
  async createTicket(ticket: any) {
    return await createOne(TicketModel, ticket);
  }

  getTicketsByUserId = async (userId: string, otherFilter?: any) => {
    try {
      const tickets = await TicketModel.find({
        userId,
        ...otherFilter,
      });
      return tickets;
    } catch (error) {
      console.error("Error fetching tickets:", error);
      throw error;
    }
  };

  getAllTicketsByUserId = async (userId: string, otherFilter?: any) => {
    try {
      const tickets = await TicketModel.find({
        userId,
      });
      const shareTickets = await TicketModel.find({
        sharedBy: userId,
      }).populate("userId", "phone");
      return { tickets, shareTickets };
    } catch (error) {
      console.error("Error fetching tickets:", error);
      throw error;
    }
  };

  async updateStatusForMultipleTickets(ticketIds: string[], status: string) {
    try {
      const validStatuses = ["Active", "Used", "Refunded"];
      if (!validStatuses.includes(status)) {
        throw new Error("Invalid status provided.");
      }

      const updatedTickets = await TicketModel.updateMany(
        { _id: { $in: ticketIds } },
        { $set: { status } },
        { new: true }
      );

      return updatedTickets;
    } catch (error: any) {
      throw new Error(error.message || "Failed to update tickets.");
    }
  }

  async updateTicketShareBy(ticketId: string, user: string, shareId: string) {
    console.log("new Id", shareId);
    console.log("userId", user);
    return await TicketModel.findByIdAndUpdate(ticketId, {
      userId: shareId,
      sharedBy: user,
    });
  }
}

export const TicketService = new ticketService();
