import mongoose from "mongoose";
import TicketReservationModel from "../models/ticket-reservation.model";
import { EventTicketService } from "./event-ticket.service";
import { BadRequestException } from "../utils/exceptions";

class ticketReservationService {
  reserveTickets = async (
    userId: mongoose.Types.ObjectId,
    orderId: string,
    selectedTickets: any[],
    reservationDurationMinutes: number = 5
  ) => {
    const reservations = [];
    const expiresAt = new Date(
      Date.now() + reservationDurationMinutes * 60 * 1000
    );

    try {
      for (const ticketGroup of selectedTickets) {
        const venueId = new mongoose.Types.ObjectId(ticketGroup._id);

        const availableTickets =
          await EventTicketService.getAvailableTicketsCount(venueId);

        for (const ticket of ticketGroup.ticketTypes) {
          const ticketTypeId = new mongoose.Types.ObjectId(ticket._id);
          const requestedQuantity = ticket.count;

          const currentReserved = await this.getReservedQuantity(
            venueId,
            ticketTypeId
          );
          const actualAvailable =
            (availableTickets[ticket._id]?.quantity || 0) - currentReserved;

          if (requestedQuantity > actualAvailable) {
            throw new BadRequestException(
              `Not enough tickets available for ${ticket.type}. Available: ${actualAvailable}, Requested: ${requestedQuantity}`
            );
          }

          const reservationId = this.generateReservationId();
          const reservation = new TicketReservationModel({
            _id: reservationId,
            userId,
            orderId,
            venueId,
            ticketTypeId,
            quantity: requestedQuantity,
            expiresAt,
            status: "reserved",
          });

          await reservation.save();
          reservations.push(reservation);

          await EventTicketService.decreaseRemainingCount(
            venueId,
            ticketTypeId,
            requestedQuantity
          );
        }
      }

      return reservations;
    } catch (error) {
      await this.cancelReservationsByOrderId(orderId);
      throw error;
    }
  };

  getReservedQuantity = async (
    venueId: mongoose.Types.ObjectId,
    ticketTypeId: mongoose.Types.ObjectId
  ): Promise<number> => {
    const result = await TicketReservationModel.aggregate([
      {
        $match: {
          venueId,
          ticketTypeId,
          status: "reserved",
          expiresAt: { $gt: new Date() },
        },
      },
      {
        $group: {
          _id: null,
          totalReserved: { $sum: "$quantity" },
        },
      },
    ]);

    return result[0]?.totalReserved || 0;
  };

  confirmReservations = async (orderId: string) => {
    const reservations = await TicketReservationModel.find({
      orderId,
      status: "reserved",
    });

    if (reservations.length === 0) {
      return { deletedCount: 0, reservations: [] };
    }

    const result = await TicketReservationModel.deleteMany({
      orderId,
      status: "reserved",
    });

    return { deletedCount: result.deletedCount, reservations };
  };

  cancelReservationsByOrderId = async (orderId: string) => {
    const reservations = await TicketReservationModel.find({
      orderId,
      status: "reserved",
    });

    if (reservations.length === 0) {
      return;
    }

    for (const reservation of reservations) {
      try {
        await EventTicketService.increaseRemainingCount(
          reservation.venueId,
          reservation.ticketTypeId,
          reservation.quantity
        );
      } catch (error) {
        console.error(
          `Failed to restore ticket count for reservation ${reservation._id}:`,
          error
        );
      }
    }

    await TicketReservationModel.deleteMany({
      orderId,
      status: "reserved",
    });

    return reservations.length;
  };

  cancelReservationsByUserId = async (
    userId: mongoose.Types.ObjectId,
    orderId?: string
  ) => {
    const filter: any = { userId, status: "reserved" };
    if (orderId) {
      filter.orderId = orderId;
    }

    const reservations = await TicketReservationModel.find(filter);

    if (reservations.length === 0) {
      return 0;
    }

    for (const reservation of reservations) {
      try {
        await EventTicketService.increaseRemainingCount(
          reservation.venueId,
          reservation.ticketTypeId,
          reservation.quantity
        );
      } catch (error) {
        console.error(
          `Failed to restore ticket count for reservation ${reservation._id}:`,
          error
        );
      }
    }

    await TicketReservationModel.deleteMany(filter);

    return reservations.length;
  };

  cleanupExpiredReservations = async () => {
    const expiredReservations = await TicketReservationModel.find({
      status: "reserved",
      expiresAt: { $lt: new Date() },
    });

    if (expiredReservations.length === 0) {
      console.log(
        `[${new Date().toISOString()}] No expired reservations to clean up`
      );
      return 0;
    }

    for (const reservation of expiredReservations) {
      try {
        await EventTicketService.increaseRemainingCount(
          reservation.venueId,
          reservation.ticketTypeId,
          reservation.quantity
        );
      } catch (error) {
        console.error(
          `Failed to restore ticket count for expired reservation ${reservation._id}:`,
          error
        );
      }
    }

    const result = await TicketReservationModel.deleteMany({
      status: "reserved",
      expiresAt: { $lt: new Date() },
    });

    console.log(
      `[${new Date().toISOString()}] Cleaned up ${
        result.deletedCount
      } expired reservations`
    );
    return result.deletedCount;
  };

  getReservationsByOrderId = async (orderId: string) => {
    return await TicketReservationModel.find({ orderId })
      .populate("userId", "firstName lastName email phone")
      .populate("venueId", "venue address date")
      .lean();
  };

  generateReservationId = (): string => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `RES_${timestamp}_${random}`;
  };

  checkAvailabilityWithReservations = async (
    venueId: mongoose.Types.ObjectId,
    ticketTypeId: mongoose.Types.ObjectId,
    requestedQuantity: number
  ) => {
    const availableTickets = await EventTicketService.getAvailableTicketsCount(
      venueId
    );
    const reservedQuantity = await this.getReservedQuantity(
      venueId,
      ticketTypeId
    );

    const actualAvailable =
      (availableTickets[ticketTypeId.toString()]?.quantity || 0) -
      reservedQuantity;

    return {
      totalTickets: availableTickets[ticketTypeId.toString()]?.quantity || 0,
      reservedTickets: reservedQuantity,
      availableTickets: actualAvailable,
      canReserve: requestedQuantity <= actualAvailable,
    };
  };
}

export const TicketReservationService = new ticketReservationService();
