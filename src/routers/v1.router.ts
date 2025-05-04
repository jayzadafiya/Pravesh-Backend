import { Router } from "express";
import authRouter from "./auth.router";
import qrRouter from "./QR.router";
import ticketRouter from "./ticket.router";
import userRouter from "./user.router";
import organizationRouter from "./organization.router";

const router = Router();

router.use("/auth", authRouter);
router.use("/qr", qrRouter);
router.use("/ticket", ticketRouter);
router.use("/users", userRouter);
router.use("/organization", organizationRouter);

export default router;
