import { TicketService } from "../services/ticket.service";

class ticketController {
  constructor() {}

  async createTicket(req: any, res: any) {
    try {
      const ticket = await TicketService.createTicket(req.body);
      res.status(201).json(ticket);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getTicketsByUserId(req: any, res: any) {
    try {
      const userId = req.params.userId;
      const tickets = await TicketService.getTicketsByUserId(userId);
      res.status(200).json(tickets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
export const TicketController = new ticketController();
