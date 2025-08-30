import express from "express";
import { ticketTransferController } from "../controllers/ticket-transfer.controller";
import protect from "../middleware/auth.middleware";

const ticketTransferRouter = express.Router();

// Get transferable tickets
ticketTransferRouter.get(
  "/transferable",
  protect,
  ticketTransferController.getTransferableTickets as any
);

// Send OTP for ticket transfer
ticketTransferRouter.post(
  "/send-otp",
  protect,
  ticketTransferController.sendTransferOTP as any
);

// Verify OTP and transfer ticket
ticketTransferRouter.post(
  "/verify-and-transfer",
  protect,
  ticketTransferController.verifyOTPAndTransfer as any
);

// Get transfer history
ticketTransferRouter.get(
  "/history",
  protect,
  ticketTransferController.getTransferHistory as any
);

// Resend OTP
ticketTransferRouter.post(
  "/resend-otp",
  protect,
  ticketTransferController.resendOTP as any
);

export default ticketTransferRouter;
