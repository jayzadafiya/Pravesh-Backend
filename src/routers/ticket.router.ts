import * as express from "express";
import { TicketController } from "../controllers/ticket.controller";
import protect from "../middleware/auth.middleware";

const ticketRouter = express.Router();

ticketRouter.get(
  "/ticket-details/:eventId",
  protect,
  TicketController.getEventTicketDetails as any
);

ticketRouter.post("/event-ticket", protect, TicketController.upsertEventTicket);
ticketRouter.post("/venue-ticket", TicketController.upsertVenueTicket);

export default ticketRouter;
