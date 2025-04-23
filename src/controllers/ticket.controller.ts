import { TicketService } from "../services/ticket.service";
import { UserService } from "../services/user.service";

class ticketController {
  constructor() {}

  createTicket = async (req: any, res: any) => {
    try {
      const ticket = await TicketService.createTicket(req.body);
      res.status(201).json(ticket);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getTicketsByUserId = async (req: any, res: any) => {
    try {
      const userId = req.params.userId;
      const user = await UserService.getUserByPhone(userId);
      const tickets = await TicketService.getTicketsByUserId(user as any);
      res.status(200).json(tickets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
  getAllTicketsByUserId = async (req: any, res: any) => {
    try {
      const userId = req.params.userId;
      const user = await UserService.getUserByPhone(userId);
      const tickets = await TicketService.getAllTicketsByUserId(user as any);
      res.status(200).json(tickets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  updateStatus = async (req: any, res: any) => {
    try {
      const { ticketIds, status } = req.body;

      if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
        return res.status(400).json({
          message: "Ticket IDs must be an array and cannot be empty.",
        });
      }

      const updatedTickets = await TicketService.updateStatusForMultipleTickets(
        ticketIds,
        status
      );

      res.status(200).json(updatedTickets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  shareTickets = async (req: any, res: any) => {
    const { ticketIds, userId, sharePhoneNumber } = req.body;

    try {
      if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
        return res.status(400).json({
          message: "Ticket IDs must be an array and cannot be empty.",
        });
      }

      let shareUser: any = await UserService.getUserByPhone(sharePhoneNumber);

      if (!shareUser.length) {
        shareUser = await UserService.cerateUser(sharePhoneNumber);
      } else {
        shareUser = shareUser[0];
      }

      console.log(shareUser);

      const promise: any = [];

      ticketIds.forEach((id: string) => {
        promise.push(
          TicketService.updateTicketShareBy(id, userId, shareUser.id)
        );
      });

      await Promise.all(promise);

      res.status(200).json();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}
export const TicketController = new ticketController();
