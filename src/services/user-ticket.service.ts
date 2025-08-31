import mongoose from "mongoose";
import { ICartEventTicket } from "../interfaces/venue-ticket.interface";
import UserTicketModel from "../models/User-ticket.model";
import TransactionModel from "../models/Transaction.model";
import { generateTicketId } from "../utils/helper-function";

class userTicketService {
  getAssignTickets = async (userId: mongoose.Types.ObjectId) => {
    const tickets: any = await UserTicketModel.find({
      user: userId,
    })
      .populate("event")
      .populate({
        path: "venue",
        select: "venue ticketTypes",
      })
      .populate({
        path: "transaction",
        select: "paymentId",
      })
      .lean();

    const cleanedTickets = tickets.map((ticket: any) => {
      const venue = ticket.venue as any;
      const ticketTypeDetails = venue?.ticketTypes?.find(
        (t: any) => t._id.toString() === ticket.ticketType.toString()
      );

      return {
        _id: ticket._id,
        status: ticket.status,
        quantity: ticket.quantity,
        price: ticket.price,
        createdAt: ticket.createdAt,
        paymentId: ticket.transaction?.paymentId || null,
        event: {
          _id: ticket.event?._id,
          name: ticket.event?.name,
          startDate: ticket.event?.startDate,
          endDate: ticket.event?.endDate,
          posterImage: ticket.event?.mainImage,
          description: ticket.event?.description,
          duration: ticket.event?.duration,
        },
        venue: {
          _id: venue?._id,
          venue: venue?.venue,
        },
        ticketType: ticket.ticketType,
        ticketTypeDetails: ticketTypeDetails && {
          _id: ticketTypeDetails._id,
          type: ticketTypeDetails.type,
        },
      };
    });

    return cleanedTickets;
  };

  createTicket = async (
    userId: mongoose.Types.ObjectId,
    selectedTickets: ICartEventTicket[],
    status = "Pending"
  ) => {
    const ticketDocs = [];

    for (const venueTicket of selectedTickets) {
      for (const ticketType of venueTicket.ticketTypes) {
        if (!ticketType._id || !ticketType.quantity || !ticketType.count)
          continue;

        for (let i = 0; i < ticketType.count; i++) {
          let ticketId = generateTicketId();

          ticketDocs.push({
            _id: ticketId,
            user: userId,
            mainUser: userId,
            event: venueTicket.eventId,
            venue: venueTicket._id,
            ticketType: ticketType._id,
            quantity: 1,
            price: ticketType.price,
            status,
            isTransferred: false,
            transferHistory: [],
          });
        }
      }
    }

    if (ticketDocs.length > 0) {
      return await UserTicketModel.insertMany(ticketDocs);
    }
  };

  UpdateStatusAndTransaction = async (
    transactionId: mongoose.Types.ObjectId,
    ticketId: string
  ) => {
    return await UserTicketModel.findByIdAndUpdate(
      { _id: ticketId },
      { $set: { status: "Confirmed", transaction: transactionId } }
    );
  };

  transferTicket = async (
    ticketId: string,
    fromUserId: mongoose.Types.ObjectId,
    toUserId: mongoose.Types.ObjectId,
    reason: "Split" | "Share" | "Transfer" = "Transfer"
  ) => {
    const ticket = await UserTicketModel.findById(ticketId);

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    if (ticket.user.toString() !== fromUserId.toString()) {
      throw new Error("Unauthorized: You don't own this ticket");
    }

    if (ticket.status !== "Confirmed") {
      throw new Error("Only confirmed tickets can be transferred");
    }

    // Update the ticket with new owner and transfer history
    const transferHistoryEntry = {
      fromUser: fromUserId,
      toUser: toUserId,
      transferredAt: new Date(),
      reason,
    };

    return await UserTicketModel.findByIdAndUpdate(
      ticketId,
      {
        $set: {
          user: toUserId,
          isTransferred: true,
          status: reason === "Transfer" ? "Confirmed" : "Transferred",
        },
        $push: {
          transferHistory: transferHistoryEntry,
        },
      },
      { new: true }
    );
  };

  getTicketsByMainUser = async (mainUserId: mongoose.Types.ObjectId) => {
    return await UserTicketModel.find({
      mainUser: mainUserId,
      status: { $in: ["Confirmed", "Transferred"] },
    })
      .populate("event")
      .populate("venue")
      .populate("user", "firstName lastName email phone")
      .populate("transferHistory.fromUser", "firstName lastName email")
      .populate("transferHistory.toUser", "firstName lastName email")
      .lean();
  };

  getTransferableTickets = async (userId: mongoose.Types.ObjectId) => {
    return await UserTicketModel.find({
      user: userId,
      status: "Confirmed",
      quantity: 1, // Only individual tickets can be transferred
    })
      .populate("event", "name startDate mainImage")
      .populate("venue", "venue")
      .populate({
        path: "venue",
        populate: {
          path: "ticketTypes",
          select: "type",
        },
      })
      .lean();
  };

  getEventTicketByUser = async (
    event: mongoose.Types.ObjectId,
    user: mongoose.Types.ObjectId
  ) => {
    const events: any = await UserTicketModel.find({ event, user })
      .populate("user")
      .populate("transaction")
      .lean();

    return events.map((ele: any) => {
      return {
        _id: ele._id,
        userId: ele.user._id,
        firatName: ele.user.firstName,
        lastName: ele.user.lastName,
        ticketType: ele.ticketType,
        quantity: ele.quantity,
        price: ele.price,
        status: ele.status,
        transaction: ele.transaction.paymentId,
        checkedInAt: ele.checkedInAt,
      };
    });
  };
  checkedInUser = async (userTicketIds: [string]) => {
    return await UserTicketModel.updateMany(
      {
        _id: {
          $in: userTicketIds,
        },
      },
      { checkedInAt: Date.now() }
    );
  };
}

export const UserTicketService = new userTicketService();
