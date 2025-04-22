import * as express from "express";
import { TicketController } from "../controllers/ticket.controller";

const ticketRouter = express.Router();

ticketRouter.post("/create-ticket", TicketController.createTicket);
ticketRouter.get("/:userId", TicketController.getTicketsByUserId);
ticketRouter.patch("/update-status", TicketController.updateStatus);

export default ticketRouter;
