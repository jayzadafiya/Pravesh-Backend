import { Request, Response } from "express";
import { QRService } from "../services/QR.service";

class qrController {
  generateQRCode = async (req: Request, res: Response) => {
    try {
      const qrURL = await QRService.generateQRCode(req.body?.userId!);
      res.status(200).send({ qrURL });
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };
}

export const QRController = new qrController();
