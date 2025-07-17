import mongoose from "mongoose";
import UserModel from "../models/User.model";
import CartModel from "../models/Cart.model";
import { createOne, deleteOne, getOne, updateOne } from "../utils/helper";
import { IVenueCartItem } from "../interfaces/cart.interface";
import { IUser } from "../interfaces/user.interface";
import { EmailService } from "./email.service";

class userService {
  getUserByPhone = async (phone: string) => {
    return await UserModel.findOne({ phone: phone });
  };

  getUserById = async (userId: mongoose.Types.ObjectId) => {
    return await getOne(UserModel, userId);
  };

  getCartItemsByUserId = async (userId: mongoose.Types.ObjectId) => {
    userId = new mongoose.Types.ObjectId(userId);
    const cartItems = await CartModel.aggregate([
      { $match: { _id: userId } },
      { $unwind: "$items" },

      {
        $lookup: {
          from: "venuetickets",
          localField: "items.venueId",
          foreignField: "_id",
          as: "venue",
        },
      },
      { $unwind: "$venue" },

      {
        $lookup: {
          from: "eventtickets",
          localField: "venue.eventTicket",
          foreignField: "_id",
          as: "eventTicket",
        },
      },
      { $unwind: "$eventTicket" },

      {
        $lookup: {
          from: "events",
          localField: "eventTicket.event",
          foreignField: "_id",
          as: "event",
        },
      },
      { $unwind: "$event" },

      {
        $addFields: {
          "venue.eventName": "$event.name",
          "venue.eventMainBanner": "$event.mainImage",
        },
      },

      {
        $addFields: {
          "venue.ticketTypes": {
            $filter: {
              input: {
                $map: {
                  input: "$venue.ticketTypes",
                  as: "tt",
                  in: {
                    _id: "$$tt._id",
                    type: "$$tt.type",
                    price: "$$tt.price",
                    quantity: "$$tt.quantity",
                    count: {
                      $ifNull: [
                        {
                          $toInt: {
                            $getField: {
                              field: { $toString: "$$tt._id" },
                              input: "$items.tickets",
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
              },
              as: "ticket",
              cond: { $gt: ["$$ticket.count", 0] },
            },
          },
        },
      },

      {
        $project: {
          _id: "$venue._id",
          date: "$venue.date",
          eventId: "$event._id",
          eventName: "$venue.eventName",
          venue: "$venue.venue",
          address: "$venue.address",
          ticketTypes: "$venue.ticketTypes",
          eventMainBanner: "$venue.eventMainBanner",
        },
      },
    ]);

    return cartItems;
  };

  getSelectedTicketsById = async (
    cartId: mongoose.Types.ObjectId,
    venueId: mongoose.Types.ObjectId
  ) => {
    const selectedTickets = await CartModel.aggregate([
      {
        $match: {
          _id: cartId,
          "items.venueId": venueId,
        },
      },
      { $unwind: "$items" },
      {
        $match: {
          "items.venueId": venueId,
        },
      },
      {
        $project: {
          _id: 0,
          selectedTickets: {
            $arrayToObject: {
              $map: {
                input: { $objectToArray: "$items.tickets" },
                as: "ticket",
                in: {
                  k: "$$ticket.k",
                  v: "$$ticket.v",
                },
              },
            },
          },
        },
      },
    ]);

    return selectedTickets[0];
  };

  cerateUser = async (phone: any) => {
    return await createOne(UserModel, { phone });
  };

  upsertCart = async (
    userId: mongoose.Types.ObjectId,
    items: IVenueCartItem[] = []
  ) => {
    let cart = await getOne(CartModel, userId);
    if (!cart) {
      return await createOne(CartModel, {
        _id: userId,
      });
    } else if (items) {
      cart.items = items;

      return await updateOne(CartModel, userId, {
        items: items,
      });
    }

    return cart;
  };

  updateUser = async (userId: mongoose.Types.ObjectId, data: IUser) => {
    return await updateOne(UserModel, userId, data);
  };

  removeCartItem = async (userId: mongoose.Types.ObjectId) => {
    return await deleteOne(CartModel, userId);
  };

  sendTicketConfirmationEmail = async (selectedTickets: any, user: any) => {
    await Promise.all(
      selectedTickets.map(async (ticketGroup: any) => {
        const ticketCount = ticketGroup.ticketTypes.reduce(
          (acc: number, type: any) => acc + +type.count,
          0
        );
        const emailPayload = {
          eventMainBanner: ticketGroup.eventMainBanner,
          eventName: ticketGroup.eventName,
          eventDateTime: ticketGroup.date,
          venueName: ticketGroup.venue,
          address: ticketGroup.address,
          ticketCount,
        };
        console.log(emailPayload);
        await EmailService.sendTicketConfirmationEmail(emailPayload, {
          email: user.email,
          qrCode: user.qrCode,
        });
      })
    );
  };
}

export const UserService = new userService();
