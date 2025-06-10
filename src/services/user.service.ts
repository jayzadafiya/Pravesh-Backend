import mongoose from "mongoose";
import UserModel from "../models/User.model";
import CartModel from "../models/Cart.model";
import {
  createOne,
  deleteOne,
  getOne,
  updateOne,
  upsertOne,
} from "../utils/helper";
import { ICart, IVenueCartItem } from "../interfaces/cart.interface";
import { AuthRequest } from "../interfaces/auth-request.interface";
import { BadRequestException } from "../utils/exceptions";

class userService {
  getUserByPhone = async (phone: string) => {
    return await UserModel.find({ phone: phone });
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
          ticketTypes: "$venue.ticketTypes",
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
  async cerateUser(phone: any) {
    return await createOne(UserModel, { phone });
  }

  upsertCart = async (
    userId: mongoose.Types.ObjectId,
    items: IVenueCartItem[] = []
  ) => {
    let cart = await getOne(CartModel, userId);
    if (!cart) {
      return await createOne(CartModel, {
        _id: userId,
      });
    } else if (cart && !items.length) {
      return cart;
    } else if (items) {
      cart.items = items;

      return await updateOne(CartModel, userId, {
        items: items,
      });
    }

    return cart;
  };

  removeCartItem = async (userId: mongoose.Types.ObjectId) => {
    return await deleteOne(CartModel, userId);
  };
}
export const UserService = new userService();
