import { Router } from "express";
import authRouter from "./auth.router";
import qrRouter from "./QR.router";

const router = Router();

router.use("/auth", authRouter);
router.use("/qr", qrRouter);

export default router;
