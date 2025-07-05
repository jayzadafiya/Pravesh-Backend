import { Request, Response } from "express";
import { AdminEventService } from "../services/event.service";

class adminEventController {
  getAllEvents = async (req: Request, res: Response) => {
    const events = await AdminEventService.getEventList();
    res.json(events);
  };
}

export const AdminEventController = new adminEventController();
