import mongoose, { FilterQuery } from 'mongoose';
import UserTicket from '../../models/User-ticket.model';
import User from '../../models/User.model';
import TransactionModel from '../../models/Transaction.model';

export class UserService {
  // Get all unique users from UserTicket collection with selected fields, ticket count, email, latest buy date, and total spent
  static async getAllUsersFromTickets(eventIds: mongoose.Types.ObjectId[] | [], page: number, limit: number, active: string) {
    try {
      console.log("Fetching users from tickets");
      // Aggregate ticket counts, latest ticket date, and total spent per user
      let query: FilterQuery<any> = {};
      if (eventIds.length > 0) {
        query = { event: { $in: eventIds }, }
      }
      let userQuery = {}
      if (active === "true") {
        userQuery = { ...userQuery, active: true }
      } else if (active === "false") {
        userQuery = { ...userQuery, active: false }
      }

      const ticketStats = await UserTicket.aggregate([
        {
          $match: query
        },
        {
          $group: {
            _id: '$user',
            ticketCount: { $sum: 1 },
            latestBuyDate: { $max: '$createdAt' },
            totalSpent: { $sum: '$price' }
          }
        }
      ]);

      // Map userId to stats for quick lookup
      const ticketStatsMap = ticketStats.reduce((acc, curr) => {
        acc[curr._id.toString()] = {
          ticketCount: curr.ticketCount,
          latestBuyDate: curr.latestBuyDate,
          totalSpent: curr.totalSpent
        };
        return acc;
      }, {} as Record<string, { ticketCount: number; latestBuyDate: Date; totalSpent: number }>);

      // Get all user IDs
      const userIds = ticketStats.map(ts => ts._id);
      userQuery = { ...userQuery, _id: { $in: userIds } };
      // Fetch user details for those IDs, including email
      const users = await User.find(
        userQuery,
        {
          firstName: 1,
          lastName: 1,
          phone: 1,
          email: 1,
          createdAt: 1,
          updatedAt: 1,
          active: 1,
          profileImage: 1,
        }
      )
        .skip((page - 1) * limit)
        .limit(limit + 1)
        .lean();
      const count = await User.countDocuments(userQuery);

      // Attach ticketCount, latestBuyDate, and totalSpent to each user object
      const usersWithStats = users.map(user => ({
        ...user,
        ticketCount: ticketStatsMap[user._id.toString()]?.ticketCount || 0,
        latestBuyDate: ticketStatsMap[user._id.toString()]?.latestBuyDate || null,
        totalSpent: ticketStatsMap[user._id.toString()]?.totalSpent || 0,
      }));

      console.log("Fetched users with ticket stats:", usersWithStats);
      return {usersWithStats,count};
    } catch (error) {
      throw new Error('Error fetching users from tickets');
    }
  }
  static async getUserStats(eventIds: mongoose.Types.ObjectId[]) {
    let query: FilterQuery<any> = {};
    if (eventIds.length > 0) {
      query = { event: { $in: eventIds }, }
    }
    const ticketStats = await UserTicket.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: '$user',
          ticketCount: { $sum: 1 },
          latestBuyDate: { $max: '$createdAt' },
          totalSpent: { $sum: '$price' }
        }
      }
    ]);
    const userIDs = ticketStats.map(ts => ts._id);
    const activeUsers = await User.countDocuments({ _id: { $in: userIDs }, active: true });

    const totalSpent = ticketStats.reduce((acc, curr) => acc + curr.totalSpent, 0);
    const totalTickets = ticketStats.reduce((acc, curr) => acc + curr.ticketCount, 0);
    const totalUsers = ticketStats.length;

    // totaluser 
    // activeUser
    // totalRevenue
    // totalSold
    return { totalSpent, totalTickets, totalUsers, activeUsers };

  }

  static async getTransaction(eventIds: mongoose.Types.ObjectId[],organizationId:mongoose.Types.ObjectId) {
    let query: FilterQuery<any> = {};
    if (eventIds.length > 0) {
      query = {event: { $in: eventIds }, }
    }
    query = {...query,organization:organizationId}
    const transactions = await UserTicket.aggregate([
      {
        $match: query
      },
      {
        $lookup:{
          from:"transactions",
          let:{transactionId:"$transaction"},
          pipeline:[
            {
              $match:{$expr:{$and:[{$eq:["$_id","$$transactionId"]}]}}
            },
            {
              $project:{
                paymentId:1,
                paymentGateway:1
              }
            }
          ],
          as:"transaction"
        }
      },
      {
        $addFields:{transaction:{$arrayElemAt:["$transaction",0]}}
      },
      {
        $lookup:{
          from:"events",
          let:{eventId:"$event"},
          pipeline:[
            {
              $match:{$expr:{$and:[{$eq:["$_id","$$eventId"]}]}}
            },
            {
              $project:{
                name:1,
              }
            }
          ],
          as:"event"
        }
      },
      {
        $addFields:{event:{$arrayElemAt:["$event",0]}}
      },
      {
        $lookup:{
          from:"users",
          let:{userId:"$user"},
          pipeline:[
            {
              $match:{$expr:{$and:[{$eq:["$_id","$$userId"]}]}}
            },
            {
              $project:{
                firstName:1,
                lastName:1,
                email:1,
                phone:1
              }
            }
          ],
          as:"user"
        }
      },
      {
        $addFields:{user:{$arrayElemAt:["$user",0]}}
      },
      
    ]);
    return transactions;
  }

  static async getTransactionStats(eventIds: mongoose.Types.ObjectId[],organizationId:mongoose.Types.ObjectId) {
    let query: FilterQuery<any> = {};
    if (eventIds.length > 0) {
      query = {event: { $in: eventIds }, }
    }
    query = {...query,organization:organizationId}
    const stats = await TransactionModel.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: {},
          totalRevenue:{$sum:"$amount"},
          success:{
            $sum: {
              $cond: {
                if: { $eq: ["$status", "paid"] },
                then: 1,
                else: 0
              }
            }
          },
          fail:{
            $sum: {
              $cond: {
                if: { $eq: ["$status", "fail"] },
                then: 1,
                else: 0
              }
            }
          },
          pending:{
            $sum: {
              $cond: {
                if: { $eq: ["$status", "pending"] },
                then: 1,
                else: 0
              }
            }
          },
        }
      }
    ]).then((ele)=>ele[0] || null);
    return {
      totalRevenue:stats?.totalRevenue || 0,
      success:stats?.success || 0,
      fail:stats?.fail || 0,
      pending:stats?.pending || 0,
    };
  }
}