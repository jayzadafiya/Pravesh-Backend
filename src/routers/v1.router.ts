import { Router } from "express";
import authRouter from "./auth.router";
import qrRouter from "./QR.router";
import ticketRouter from "./ticket.router";

const router = Router();

router.use("/auth", authRouter);
router.use("/qr", qrRouter);
router.use("/ticket", ticketRouter);

export default router;
