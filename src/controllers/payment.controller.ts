import { Response } from "express";
import { AuthRequest } from "../interfaces/auth-request.interface";
import { BadRequestException } from "../utils/exceptions";
import { PaymentService } from "../services/payment.service";
import { CashFreeService } from "../services/cashfree.service";
import { UserTicketService } from "../services/user-ticket.service";
import { TransactionService } from "../services/transaction.service";
import { ITransaction } from "../interfaces/transaction.interface";
import { UserService } from "../services/user.service";
import { EventTicketService } from "../services/event-ticket.service";
import mongoose from "mongoose";

class paymentController {
  // RAZORPAY METHODS (COMMENTED FOR BACKWARD COMPATIBILITY)
  // processPayment = async (req: AuthRequest, res: Response) => {
  //   try {
  //     const { amount, currency, selectedTickets } = req.body;
  //     if (!amount || typeof amount !== "number" || amount <= 1) {
  //       throw new BadRequestException(
  //         "Invalid amount. Amount must be a number greater than 1."
  //       );
  //     }
  //     if (!Array.isArray(selectedTickets) || selectedTickets.length === 0) {
  //       throw new BadRequestException("Selected tickets are required");
  //     }
  //     for (const ticketGroup of selectedTickets) {
  //       const venueId = ticketGroup._id;
  //       const ticketTypes = ticketGroup.ticketTypes;
  //       const availableTickets =
  //         await EventTicketService.getAvailableTicketsCount(
  //           new mongoose.Types.ObjectId(venueId)
  //         );
  //       for (const ticket of ticketTypes) {
  //         const availableQuantity = availableTickets[ticket._id]?.quantity || 0;
  //         if (ticket.count > availableQuantity) {
  //           throw new BadRequestException(
  //             `Not enough availability for ticket type: ${ticket.type}`
  //           );
  //         }
  //       }
  //     }
  //     const order = await PaymentService.createPaymentIntent(amount, currency);
  //     res.status(200).send(order);
  //   } catch (error: any) {
  //     console.error("Error processing payment:", error);
  //     res.status(error.statusCode || 500).send({ message: error.message });
  //   }
  // };

  // checkAndAddTickets = async (req: AuthRequest, res: Response) => {
  //   try {
  //     console.log("Checking and adding tickets...", req.body);
  //     const {
  //       razorpay_order_id,
  //       razorpay_payment_id,
  //       razorpay_signature,
  //       selectedTickets,
  //       amount,
  //     } = req.body;
  //     const userId = req.user?.id;
  //     if (!userId) {
  //       throw new BadRequestException("User ID is required.");
  //     }
  //     if (!selectedTickets || selectedTickets.length === 0) {
  //       throw new BadRequestException("No tickets selected.");
  //     }
  //     const user = await UserService.getUserById(userId);
  //     if (!user) {
  //       throw new BadRequestException("User not found");
  //     }
  //     const newTickets = await UserTicketService.createTicket(
  //       userId,
  //       selectedTickets
  //     );
  //     if (!razorpay_order_id || !razorpay_payment_id) {
  //       throw new BadRequestException("Order ID and Payment ID are required.");
  //     }
  //     const signature = await PaymentService.verifyPaymentSignature(
  //       razorpay_order_id,
  //       razorpay_payment_id
  //     );
  //     if (signature !== razorpay_signature) {
  //       throw new BadRequestException("Invalid payment signature.");
  //     }
  //     const payment = await PaymentService.fetchPaymentDetails(
  //       razorpay_payment_id
  //     );
  //     const transactionData = {
  //       user: userId,
  //       orderId: razorpay_order_id,
  //       paymentId: razorpay_payment_id,
  //       signature: razorpay_signature,
  //       status: "paid",
  //       currency: payment.currency,
  //       method: payment.method,
  //       email: payment.email,
  //       amount,
  //       contact: payment.contact.toString(),
  //       paymentGateway: "razorpay" as const,
  //     };
  //     const transaction = await TransactionService.addTransaction(
  //       transactionData as ITransaction
  //     );
  //     if (newTickets && newTickets.length > 0) {
  //       await Promise.all(
  //         newTickets.map((ticket) =>
  //           UserTicketService.UpdateStatusAndTransaction(
  //             transaction._id,
  //             ticket._id
  //           )
  //         )
  //       );
  //     }
  //     res.status(200).send({ data: req.body });
  //     // Background task using process.nextTick or setImmediate
  //     setImmediate(async () => {
  //       try {
  //         //Decrease ticket count
  //         await Promise.all(
  //           selectedTickets.map((ticketGroup: any) =>
  //             Promise.all(
  //               ticketGroup.ticketTypes.map((ticketType: any) => {
  //                 console.log(
  //                   "============",
  //                   new mongoose.Types.ObjectId(ticketGroup._id),
  //                   new mongoose.Types.ObjectId(ticketType._id),
  //                   ticketType.count,
  //                   "============"
  //                 );
  //                 return EventTicketService.decreaseRemainingCount(
  //                   new mongoose.Types.ObjectId(ticketGroup._id),
  //                   new mongoose.Types.ObjectId(ticketType._id),
  //                   ticketType.count
  //                 );
  //               })
  //             )
  //           )
  //         );
  //         // Send ticket confirmation email
  //         await UserService.sendTicketConfirmationEmail(selectedTickets, user);
  //         await UserService.removeCartItem(userId);
  //       } catch (err: any) {
  //         console.error("Background task failed:", err.message);
  //       }
  //     });
  //   } catch (error: any) {
  //     console.error("Error verifying payment signature:", error);
  //     res.status(error.statusCode || 500).send({ message: error.message });
  //   }
  // };

  createCashfreePaymentOrder = async (req: AuthRequest, res: Response) => {
    try {
      const { amount, currency = "INR", selectedTickets } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestException("User ID is required");
      }

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
          if (ticket.count > 10) {
            throw new BadRequestException(
              "You cannot purchase more than 10 tickets."
            );
          }

          if (ticket.count > availableQuantity) {
            throw new BadRequestException(
              `Not enough availability for ticket type: ${ticket.type}`
            );
          }
        }
      }

      const user = await UserService.getUserById(userId);
      if (!user) {
        throw new BadRequestException("User not found");
      }

      const orderId = CashFreeService.generateOrderId();

      const cashfreeOrder = await CashFreeService.createPaymentOrder(
        amount,
        currency,
        orderId,
        {
          customer_id: userId.toString(),
          customer_email: user.email,
          customer_phone: user.phone,
          customer_name: user.firstName || user.phone,
        }
      );

      res.status(200).send({
        success: true,
        orderId: orderId,
        paymentSessionId: cashfreeOrder.payment_session_id,
        orderToken: cashfreeOrder.order_token,
        amount: amount,
        currency: currency,
      });
    } catch (error: any) {
      console.error("Error creating Cashfree payment order:", error);
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  verifyCashfreePaymentAndAddTickets = async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const { orderId, selectedTickets, referenceId, paymentMode, eventId } =
        req.body;

      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestException("User ID is required.");
      }

      if (!selectedTickets || selectedTickets.length === 0) {
        throw new BadRequestException("No tickets selected.");
      }

      if (!orderId) {
        throw new BadRequestException("Order ID is required.");
      }

      // STEP 1: Verify payment via API (MOST RELIABLE AND SECURE)
      const apiVerification = await CashFreeService.verifyPaymentViaAPI(
        orderId
      );

      if (!apiVerification.isValid) {
        throw new BadRequestException(
          `Payment verification failed: ${
            apiVerification.error || "Unknown error"
          }`
        );
      }

      if (!apiVerification.isPaid) {
        throw new BadRequestException(
          `Payment not successful. Status: ${apiVerification.status}`
        );
      }

      const user = await UserService.getUserById(userId);
      if (!user) {
        throw new BadRequestException("User not found");
      }

      const newTickets = await UserTicketService.createTicket(
        userId,
        selectedTickets
      );

      if (!newTickets?.length) {
        throw new BadRequestException("Tickets are not created");
      }

      const verifiedOrderData = apiVerification.orderData;

      const transactionData = {
        user: userId,
        orderId: orderId,
        paymentId: verifiedOrderData.cf_order_id || referenceId,
        event: new mongoose.Types.ObjectId(newTickets[0].event),
        paymentGateway: "cashfree" as const,
        status: "paid" as const,
        currency: verifiedOrderData.order_currency || "INR",
        method: verifiedOrderData.payment_method || paymentMode || "unknown",
        email: user.email,
        amount: apiVerification.orderAmount,
        contact: user.phone,
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

      res.status(200).send({
        success: true,
        message: "Payment verified and tickets added successfully",
        transactionId: transaction._id,
        data: {
          orderId,
          paymentId: verifiedOrderData.cf_order_id || referenceId,
          amount: apiVerification.orderAmount,
          status: apiVerification.status,
          verificationMethod: "API",
        },
      });

      setImmediate(async () => {
        try {
          await Promise.all(
            selectedTickets.map((ticketGroup: any) =>
              Promise.all(
                ticketGroup.ticketTypes.map((ticketType: any) => {
                  console.log(
                    "Decreasing ticket count:",
                    new mongoose.Types.ObjectId(ticketGroup._id),
                    new mongoose.Types.ObjectId(ticketType._id),
                    ticketType.count
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

          const createdTickets = await UserTicketService.getAssignTickets(
            new mongoose.Types.ObjectId(userId)
          );

          const orderTickets = createdTickets.filter(
            (ticket: any) =>
              ticket.paymentId ===
              (verifiedOrderData.cf_order_id || referenceId)
          );

          const updatedSelectedTickets = selectedTickets.map(
            (ticketGroup: any) => {
              const firstTicket = orderTickets.find(
                (ticket: any) =>
                  ticket.venue._id.toString() === ticketGroup._id.toString()
              );

              return {
                ...ticketGroup,
                ticketId: firstTicket?._id || "N/A",
                paymentId:
                  verifiedOrderData.cf_order_id || referenceId || "N/A",
              };
            }
          );

          await UserService.sendTicketConfirmationEmail(
            updatedSelectedTickets,
            user
          );

          await UserService.removeCartItem(userId);

          console.log("Background tasks completed successfully");
        } catch (err: any) {
          console.error("Background task failed:", err.message);
        }
      });
    } catch (error: any) {
      console.error("Error verifying Cashfree payment:", error);
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  handleCashfreeWebhook = async (req: any, res: Response) => {
    try {
      console.log("Cashfree webhook received:", req.headers, req.body);

      const signature = req.headers["x-webhook-signature"];
      const timestamp = req.headers["x-webhook-timestamp"];
      const rawBody = JSON.stringify(req.body);

      if (!signature || !timestamp) {
        console.error("Missing webhook signature or timestamp");
        return res.status(400).send({ message: "Missing signature headers" });
      }

      const isWebhookValid = CashFreeService.verifyWebhookSignature(
        rawBody,
        signature,
        timestamp
      );

      if (!isWebhookValid) {
        console.error("Invalid webhook signature");
        return res.status(400).send({ message: "Invalid signature" });
      }

      const webhookData = req.body;
      const orderId = webhookData.order?.order_id;
      const orderStatus = webhookData.order?.order_status;
      const paymentStatus = webhookData.payment?.payment_status;

      console.log(
        `Webhook verified for order: ${orderId}, status: ${orderStatus}`
      );

      if (orderStatus === "PAID" && paymentStatus === "SUCCESS") {
        console.log(`Payment successful for order: ${orderId}`);
        await TransactionService.updateTransactionStatus(orderId, "paid");
      } else if (orderStatus === "FAILED" || paymentStatus === "FAILED") {
        await TransactionService.updateTransactionStatus(orderId, "failed");
      }

      res.status(200).send({ message: "Webhook processed successfully" });
    } catch (error: any) {
      console.error("Cashfree webhook error:", error);
      res.status(500).send({ message: "Webhook processing failed" });
    }
  };

  // Get payment status
  getCashfreePaymentStatus = async (req: AuthRequest, res: Response) => {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        throw new BadRequestException("Order ID is required");
      }

      const orderDetails = await CashFreeService.getOrderDetails(orderId);

      res.status(200).send({
        success: true,
        orderStatus: orderDetails.order_status,
        paymentStatus: orderDetails.payment_status,
        orderAmount: orderDetails.order_amount,
        orderCurrency: orderDetails.order_currency,
      });
    } catch (error: any) {
      console.error("Error fetching payment status:", error);
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };
}

export const PaymentController = new paymentController();
