import { Response } from "express";
import { AuthRequest } from "../interfaces/auth-request.interface";
import { BadRequestException } from "../utils/exceptions";
import { PaymentService } from "../services/payment.service";
import { UserTicketService } from "../services/user-ticket.service";
import { TransactionService } from "../services/transaction.service";
import { ITransaction } from "../interfaces/transaction.interface";
import { UserService } from "../services/user.service";
import { EventTicketService } from "../services/event-ticket.service";
import mongoose from "mongoose";

class paymentController {
  processPayment = async (req: AuthRequest, res: Response) => {
    try {
      const { amount, currency, selectedTickets } = req.body;

      if (!amount || typeof amount !== "number" || amount <= 1) {
        throw new BadRequestException(
          "Invalid amount. Amount must be a number greater than 1."
        );
      }

      if (!Array.isArray(selectedTickets) || selectedTickets.length === 0) {
        throw new BadRequestException("Selected tickets are required");
      }

      for (const ticketGroup of selectedTickets) {
        const venueId = ticketGroup._id;
        const ticketTypes = ticketGroup.ticketTypes;

        const availableTickets =
          await EventTicketService.getAvailableTicketsCount(
            new mongoose.Types.ObjectId(venueId)
          );

        for (const ticket of ticketTypes) {
          const availableQuantity = availableTickets[ticket._id]?.quantity || 0;

          if (ticket.count > availableQuantity) {
            throw new BadRequestException(
              `Not enough availability for ticket type: ${ticket.type}`
            );
          }
        }
      }
      const order = await PaymentService.createPaymentIntent(amount, currency);

      res.status(200).send(order);
    } catch (error: any) {
      console.error("Error processing payment:", error);
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  checkAndAddTickets = async (req: AuthRequest, res: Response) => {
    try {
      console.log("Checking and adding tickets...", req.body);
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        selectedTickets,
        amount,
      } = req.body;

      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestException("User ID is required.");
      }
      if (!selectedTickets || selectedTickets.length === 0) {
        throw new BadRequestException("No tickets selected.");
      }

      const user = await UserService.getUserById(userId);

      if (!user) {
        throw new BadRequestException("User not found");
      }

      const newTickets = await UserTicketService.createTicket(
        userId,
        selectedTickets
      );

      if (!razorpay_order_id || !razorpay_payment_id) {
        throw new BadRequestException("Order ID and Payment ID are required.");
      }

      const signature = await PaymentService.verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id
      );

      if (signature !== razorpay_signature) {
        throw new BadRequestException("Invalid payment signature.");
      }

      const payment = await PaymentService.fetchPaymentDetails(
        razorpay_payment_id
      );

      const transactionData = {
        user: userId,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        status: "paid",
        currency: payment.currency,
        method: payment.method,
        email: payment.email,
        amount,
        contact: payment.contact.toString(),
      };

      const transaction = await TransactionService.addTransaction(
        transactionData as ITransaction
      );

      if (newTickets && newTickets.length > 0) {
        await Promise.all(
          newTickets.map((ticket) =>
            UserTicketService.UpdateStatusAndTransaction(
              transaction._id,
              ticket._id
            )
          )
        );
      }

      res.status(200).send({ data: req.body });

      // Background task using process.nextTick or setImmediate
      setImmediate(async () => {
        try {
          //Decrease ticket count
          await Promise.all(
            selectedTickets.map((ticketGroup: any) =>
              Promise.all(
                ticketGroup.ticketTypes.map((ticketType: any) => {
                  console.log(
                    "============",
                    new mongoose.Types.ObjectId(ticketGroup._id),
                    new mongoose.Types.ObjectId(ticketType._id),
                    ticketType.count,
                    "============"
                  );
                  return EventTicketService.decreaseRemainingCount(
                    new mongoose.Types.ObjectId(ticketGroup._id),
                    new mongoose.Types.ObjectId(ticketType._id),
                    ticketType.count
                  );
                })
              )
            )
          );

          // Send ticket confirmation email
          await UserService.sendTicketConfirmationEmail(selectedTickets, user);

          await UserService.removeCartItem(userId);
        } catch (err: any) {
          console.error("Background task failed:", err.message);
        }
      });
    } catch (error: any) {
      console.error("Error verifying payment signature:", error);
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };
}

export const PaymentController = new paymentController();
