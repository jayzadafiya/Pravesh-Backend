import mongoose from "mongoose";
import { Response } from "express";
import { BadRequestException } from "../utils/exceptions";
import { AuthRequest } from "../interfaces/auth-request.interface";
import { UserService } from "../services/user.service";
import { EventTicketService } from "../services/event-ticket.service";
import { UserTicketService } from "../services/user-ticket.service";
import { CloudinaryService } from "../services/cloudinary.service";
import { AuthService } from "../services/auth.service";
import { EmailService } from "../services/email.service";
import { OrganizationService } from "../services/organization.service";

class userController {
  getUserByToken = async (req: any, res: any) => {
    try {
      if (!req.user) {
        throw new BadRequestException("User not found");
      }
      return res.status(200).send(req.user);
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  getCartItems = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const cartItem = await UserService.getCartItemsByUserId(userId);

      res.status(200).send({ cartData: cartItem || [] });
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  getUserAssignTickets = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    const assignTickets = await UserTicketService.getAssignTickets(
      new mongoose.Types.ObjectId(userId)
    );

    res.status(200).send(assignTickets);
  };

  getSelectedTickets = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { venueId } = req.params;

    try {
      if (!userId) {
        throw new BadRequestException("User ID is required");
      }

      if (!venueId || !mongoose.Types.ObjectId.isValid(venueId)) {
        throw new BadRequestException("Invalid Venue ID format");
      }

      const selectedTickets = await UserService.getSelectedTicketsById(
        new mongoose.Types.ObjectId(userId),
        new mongoose.Types.ObjectId(venueId)
      );

      res.status(200).json(selectedTickets);
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  updateCartItems = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { items } = req.body;

      if (!items || typeof items !== "object" || Array.isArray(items)) {
        return res.status(400).json({ message: "Invalid items format" });
      }

      const cart = await UserService.upsertCart(userId);
      for (const [venueId, ticketsArray] of Object.entries(items)) {
        if (!mongoose.Types.ObjectId.isValid(venueId)) continue;

        const venueObjectId = new mongoose.Types.ObjectId(venueId);
        const existingVenue = cart.items.find(
          (item) => item.venueId.toString() === venueId
        );

        if (!existingVenue) {
          // Add new venue if it doesn't exist
          const newTickets: Record<string, number> = {};

          for (const ticketObj of ticketsArray as Record<string, number>[]) {
            const [ticketId, quantity] = Object.entries(ticketObj)[0];
            if (
              mongoose.Types.ObjectId.isValid(ticketId) &&
              typeof quantity === "number" &&
              quantity > 0
            ) {
              newTickets[ticketId] = quantity;
            }
          }

          if (Object.keys(newTickets).length > 0) {
            cart.items.push({
              venueId: venueObjectId,
              tickets: newTickets,
            });
          }

          continue;
        }

        // Update existing tickets
        for (const ticketObj of ticketsArray as Record<string, number>[]) {
          const [ticketId, quantity] = Object.entries(ticketObj)[0];

          if (!mongoose.Types.ObjectId.isValid(ticketId)) continue;

          if (existingVenue.tickets instanceof Map) {
            if (quantity <= 0) {
              existingVenue.tickets.delete(ticketId);
            } else {
              existingVenue.tickets.set(ticketId, quantity);
            }
          } else {
            if (quantity <= 0) {
              delete existingVenue.tickets[ticketId];
            } else {
              existingVenue.tickets[ticketId] = quantity;
            }
          }
        }
      }

      // 🧹 Remove venues with empty ticket objects
      cart.items = cart.items.filter((item) => {
        if (item.tickets instanceof Map) {
          return item.tickets.size > 0;
        } else {
          return Object.keys(item.tickets || {}).length > 0;
        }
      });

      await UserService.upsertCart(userId, cart.items);
      res.status(201).send(cart.items);
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  updateUserDetails = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const userData = req.body;

      if (!userId) {
        throw new BadRequestException("User ID is required");
      }

      if (!userData || Object.keys(userData).length === 0) {
        throw new BadRequestException("No data provided for update");
      }

      if (!userData.phone || typeof userData.phone !== "string") {
        throw new BadRequestException(
          "Phone number is required and must be a string"
        );
      }

      const user = await UserService.getUserByPhone(userData.phone);
      if (!user) {
        throw new BadRequestException("User not found");
      }

      let profileImage = user.profileImage;
      if (req.file) {
        profileImage = await CloudinaryService.uploadImageIfExists(
          req.file,
          "ProfileImage"
        );
      }
      const updatedUser = (await UserService.updateUser(userId, {
        ...userData,
        profileImage,
      })) as any;

      // if (userData?.email !== updatedUser.email) {
      updatedUser.emailVerified = false;
      const JWTToken = await AuthService.signToken(userId, "5m");
      await EmailService.sendAuthEmail(updatedUser.email, JWTToken);
      await updatedUser.save();
      // }
      res.status(200).json(updatedUser);
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  addFreeTicket = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const {
      eventId,
      venueId,
      items,
    }: { eventId: string; venueId: string; items: { [x: string]: number } } =
      req.body;

    if (!eventId || !venueId || !items) {
      throw new BadRequestException("Please provide valid input data");
    }

    const user = await UserService.getUserById(userId);

    if (!user) {
      throw new BadRequestException("User not found");
    }
    const availableTickets = await EventTicketService.getAvailableTicketsCount(
      new mongoose.Types.ObjectId(venueId)
    );

    const ticketTypes: any = [];
    for (const ticketId in items) {
      const quantity = items[ticketId];
      const availableQuantity = availableTickets[ticketId].quantity || 0;

      if (quantity > availableQuantity) {
        throw new BadRequestException(`Something went wrong`);
      }

      ticketTypes.push({
        _id: ticketId,
        price: 0,
        quantity: availableQuantity,
        count: quantity,
      });
    }

    const selectedTickets: any = [
      {
        _id: new mongoose.Types.ObjectId(venueId),
        eventId: eventId,
        ticketTypes,
      },
    ];

    await UserTicketService.createTicket(userId, selectedTickets, "Confirmed");

    await Promise.all(
      ticketTypes.map((ticket: any) =>
        EventTicketService.decreaseRemainingCount(
          new mongoose.Types.ObjectId(venueId),
          new mongoose.Types.ObjectId(ticket._id),
          ticket.count
        )
      )
    );
    res.status(201).send({ message: "Free tickets added successfully" });

    setImmediate(async () => {
      try {
        const event = await OrganizationService.getEventById(eventId);
        const venue = await EventTicketService.getVenueTicketById(
          new mongoose.Types.ObjectId(venueId)
        );

        const createdTickets = await UserTicketService.getAssignTickets(
          new mongoose.Types.ObjectId(userId)
        );

        const eventTickets = createdTickets.filter(
          (ticket: any) => ticket.event._id.toString() === eventId
        );

        const firstTicket = eventTickets[0];
        const ticketId = firstTicket?._id || "N/A";
        const paymentId = firstTicket?.paymentId || "FREE-TICKET";

        const emailSelectedTickets = [
          {
            _id: new mongoose.Types.ObjectId(venueId),
            eventMainBanner: event?.mainImage,
            eventId: eventId,
            eventName: event?.name,
            date: venue?.date,
            venue: venue?.venue,
            address: venue?.address,
            ticketTypes,
            ticketId: ticketId,
            paymentId: paymentId,
          },
        ];

        await UserService.sendTicketConfirmationEmail(
          emailSelectedTickets,
          user
        );
      } catch (err: any) {
        console.error("Background task failed:", err.message);
      }
    });
  };
}

export const UserController = new userController();
