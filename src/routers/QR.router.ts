import * as express from "express";
import { QRController } from "../controllers/QR.controller";

const qrRouter = express.Router();

qrRouter.post("/generate-qr", QRController.generateQRCode);

export default qrRouter;
