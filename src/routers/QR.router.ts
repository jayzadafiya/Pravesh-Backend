import * as express from "express";
import { QRController } from "../controllers/QR.controller";
import { verify } from "../validations/qr.validation";
import { validateRequest } from "../middleware/validate-request";

const qrRouter = express.Router();

qrRouter.post("/generate-qr", QRController.generateQRCode);
qrRouter.post("/verify", verify, validateRequest, QRController.verifyQRCode);
qrRouter.post("/checkedin", verify, validateRequest, QRController.verifyTickets);

export default qrRouter;
