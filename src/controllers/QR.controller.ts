import { Request, Response } from "express";
import { QRService } from "../services/QR.service";
import { UserTicketService } from "../services/user-ticket.service";
import mongoose from "mongoose";

class qrController {
  generateQRCode = async (req: Request, res: Response) => {
    try {
      const qrURL = await QRService.generateQRCode(req.body?.userId!);
      res.status(200).send({ qrURL });
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  verifyQRCode = async (req: Request, res: Response) => {
    try {
      const { userId,eventId } = req.body;
      const event = new mongoose.Types.ObjectId(eventId);
      const user = new mongoose.Types.ObjectId(userId);
      const eventTicketDetails = await UserTicketService.getEventTicketByUser(event,user)
      res.status(200).send({ success:true,data:eventTicketDetails });
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  }

  verifyTickets = async (req: Request, res: Response) => {
    try {
      const { userTicketIds } = req.body;
      const ticketUserObjectId = userTicketIds.map((id:string) => new mongoose.Types.ObjectId(id))
      const userTickets = await UserTicketService.checkedInUser(ticketUserObjectId)
      res.status(200).send({ success:true,data:userTickets });
    } 
    catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  }
}

export const QRController = new qrController();
