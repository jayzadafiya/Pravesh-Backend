import mongoose, { FilterQuery } from "mongoose";
import UserTicket from "../../models/User-ticket.model";
import User from "../../models/User.model";
import TransactionModel from "../../models/Transaction.model";
import UserTicketModel from "../../models/User-ticket.model";

export class UserService {
  static async getAllUsersFromTickets(
    eventIds: mongoose.Types.ObjectId[] | [],
    page: number,
    limit: number,
    active: string
  ) {
    try {
      let query: FilterQuery<any> = {};
      if (eventIds.length > 0) {
        query = { event: { $in: eventIds } };
      }
      let userQuery = {};
      if (active === "true") {
        userQuery = { ...userQuery, active: true };
      } else if (active === "false") {
        userQuery = { ...userQuery, active: false };
      }

      const ticketStats = await UserTicket.aggregate([
        {
          $match: query,
        },
        {
          $group: {
            _id: "$user",
            ticketCount: { $sum: 1 },
            latestBuyDate: { $max: "$createdAt" },
            totalSpent: { $sum: "$price" },
          },
        },
      ]);

      const ticketStatsMap = ticketStats.reduce((acc, curr) => {
        acc[curr._id.toString()] = {
          ticketCount: curr.ticketCount,
          latestBuyDate: curr.latestBuyDate,
          totalSpent: curr.totalSpent,
        };
        return acc;
      }, {} as Record<string, { ticketCount: number; latestBuyDate: Date; totalSpent: number }>);

      const userIds = ticketStats.map((ts) => ts._id);
      userQuery = { ...userQuery, _id: { $in: userIds } };
      const users = await User.find(userQuery, {
        firstName: 1,
        lastName: 1,
        createdAt: 1,
        updatedAt: 1,
        active: 1,
        profileImage: 1,
      })
        .skip((page - 1) * (limit - 1))
        .limit(limit + 1)
        .lean();
      const count = await User.countDocuments(userQuery);

      const usersWithStats = users.map((user) => ({
        ...user,
        ticketCount: ticketStatsMap[user._id.toString()]?.ticketCount || 0,
        latestBuyDate:
          ticketStatsMap[user._id.toString()]?.latestBuyDate || null,
        totalSpent: ticketStatsMap[user._id.toString()]?.totalSpent || 0,
      }));

      console.log("Fetched users with ticket stats:", usersWithStats);
      return { usersWithStats, count };
    } catch (error) {
      throw new Error("Error fetching users from tickets");
    }
  }
  static async getUserStats(eventIds: mongoose.Types.ObjectId[]) {
    let query: FilterQuery<any> = {};
    if (eventIds.length > 0) {
      query = { event: { $in: eventIds } };
    }
    const ticketStats = await UserTicket.aggregate([
      {
        $match: query,
      },
      {
        $group: {
          _id: "$user",
          ticketCount: { $sum: 1 },
          latestBuyDate: { $max: "$createdAt" },
          totalSpent: { $sum: "$price" },
        },
      },
    ]);
    const userIDs = ticketStats.map((ts) => ts._id);
    const activeUsers = await User.countDocuments({
      _id: { $in: userIDs },
      active: true,
    });

    const totalSpent = ticketStats.reduce(
      (acc, curr) => acc + curr.totalSpent,
      0
    );
    const totalTickets = ticketStats.reduce(
      (acc, curr) => acc + curr.ticketCount,
      0
    );
    const totalUsers = ticketStats.length;

    return { totalSpent, totalTickets, totalUsers, activeUsers };
  }

  static async getTransaction(
    eventIds: mongoose.Types.ObjectId[],
    page: number,
    limit: number
  ) {
    let eventQuery: FilterQuery<any> = {};
    if (eventIds.length > 0) {
      eventQuery = { event: { $in: eventIds } };
    }

    const uniqueTransactionIds = await UserTicketModel.aggregate([
      { $match: eventQuery },
      { $match: { transaction: { $exists: true, $ne: null } } },
      { $group: { _id: "$transaction" } },
    ]).then((results) => results.map((item) => item._id));

    const transactions = await TransactionModel.aggregate([
      {
        $match: { _id: { $in: uniqueTransactionIds } },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $addFields: { userData: { $arrayElemAt: ["$userData", 0] } },
      },
      {
        $lookup: {
          from: "usertickets",
          let: { transactionId: "$_id" },
          pipeline: [
            {
              $match: { $expr: { $eq: ["$transaction", "$$transactionId"] } },
            },
            { $match: eventQuery }, // Apply event filter to tickets
            {
              $lookup: {
                from: "events",
                localField: "event",
                foreignField: "_id",
                as: "eventData",
              },
            },
            {
              $addFields: { eventData: { $arrayElemAt: ["$eventData", 0] } },
            },
            {
              $project: {
                _id: 1,
                event: 1,
                "eventData.name": 1,
                venue: 1,
                ticketType: 1,
                price: 1,
                status: 1,
              },
            },
          ],
          as: "tickets",
        },
      },
      {
        $project: {
          _id: 1,
          paymentId: 1,
          amount: 1,
          status: 1,
          createdAt: 1,
          user: {
            _id: "$userData._id",
            firstName: "$userData.firstName",
            lastName: "$userData.lastName",
          },
          event: {
            $cond: [
              { $gt: [{ $size: "$tickets" }, 0] },
              {
                _id: { $arrayElemAt: ["$tickets.event", 0] },
                name: { $arrayElemAt: ["$tickets.eventData.name", 0] },
              },
              null,
            ],
          },
          ticketsCount: { $size: "$tickets" },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: (page - 1) * (limit - 1),
      },
      {
        $limit: limit,
      },
    ]);

    const count = uniqueTransactionIds.length;

    return { transactions, count };
  }

  static async getTransactionStats(eventIds: mongoose.Types.ObjectId[]) {
    let query: FilterQuery<any> = {};
    if (eventIds.length > 0) {
      query = { event: { $in: eventIds } };
    }
    const stats = await TransactionModel.aggregate([
      {
        $match: query,
      },
      {
        $group: {
          _id: {},
          totalRevenue: { $sum: "$amount" },
          success: {
            $sum: {
              $cond: {
                if: { $eq: ["$status", "paid"] },
                then: 1,
                else: 0,
              },
            },
          },
          fail: {
            $sum: {
              $cond: {
                if: { $eq: ["$status", "fail"] },
                then: 1,
                else: 0,
              },
            },
          },
          pending: {
            $sum: {
              $cond: {
                if: { $eq: ["$status", "pending"] },
                then: 1,
                else: 0,
              },
            },
          },
        },
      },
    ]).then((ele) => ele[0] || null);
    console.log("Aggregated transaction stats:", stats);
    return {
      totalRevenue: stats?.totalRevenue || 0,
      success: stats?.success || 0,
      fail: stats?.fail || 0,
      pending: stats?.pending || 0,
    };
  }
}
