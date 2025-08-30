import { Response } from "express";
import { AuthRequest } from "../interfaces/auth-request.interface";
import { UserTicketService } from "../services/user-ticket.service";
import { otpService } from "../services/otp.service";
import { BadRequestException } from "../utils/exceptions";
import mongoose from "mongoose";

class TicketTransferController {
  // Get transferable tickets for the authenticated user
  getTransferableTickets = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestException("User ID is required");
      }

      const tickets = await UserTicketService.getTransferableTickets(
        new mongoose.Types.ObjectId(userId)
      );

      res.status(200).json({
        success: true,
        data: tickets,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
    }
  };

  // Step 1: Send OTP to recipient
  sendTransferOTP = async (req: AuthRequest, res: Response) => {
    try {
      const { email, phone } = req.body;

      if (!email || !phone) {
        throw new BadRequestException("Email and phone are required");
      }

      const result = await otpService.sendOTPForTicketTransfer(email, phone);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
    }
  };

  // Step 2: Verify OTP and complete transfer
  verifyOTPAndTransfer = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const {
        ticketId,
        email,
        otp,
        firstName,
        lastName,
        transferType = "Transfer",
      } = req.body;

      if (!userId || !ticketId || !email || !otp) {
        throw new BadRequestException(
          "User ID, ticket ID, email, and OTP are required"
        );
      }

      // Verify OTP and get recipient user
      const verificationResult = await otpService.verifyOTPForTicketTransfer(
        email,
        otp,
        firstName,
        lastName
      );

      // Transfer the ticket
      const transferredTicket = await UserTicketService.transferTicket(
        ticketId,
        new mongoose.Types.ObjectId(userId),
        new mongoose.Types.ObjectId(verificationResult.userId),
        transferType as "Split" | "Share" | "Transfer"
      );

      res.status(200).json({
        success: true,
        message: "Ticket transferred successfully",
        data: {
          transferredTicket,
          recipient: verificationResult.user,
        },
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
    }
  };

  // Get transfer history for user's tickets
  getTransferHistory = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestException("User ID is required");
      }

      const tickets = await UserTicketService.getTicketsByMainUser(
        new mongoose.Types.ObjectId(userId)
      );

      res.status(200).json({
        success: true,
        data: tickets,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
    }
  };

  // Resend OTP
  resendOTP = async (req: AuthRequest, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        throw new BadRequestException("Email is required");
      }

      const result = await otpService.resendOTP(email);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
    }
  };
}

export const ticketTransferController = new TicketTransferController();
