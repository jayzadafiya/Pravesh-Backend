import UserTicket from '../../models/User-ticket.model';
import User from '../../models/User.model';

export class UserService {
  // Get all unique users from UserTicket collection with selected fields, ticket count, email, latest buy date, and total spent
  static async getAllUsersFromTickets() {
    try {
        console.log("Fetching users from tickets");
      // Aggregate ticket counts, latest ticket date, and total spent per user
      const ticketStats = await UserTicket.aggregate([
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

      // Fetch user details for those IDs, including email
      const users = await User.find(
        { _id: { $in: userIds } },
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
      ).lean();

      // Attach ticketCount, latestBuyDate, and totalSpent to each user object
      const usersWithStats = users.map(user => ({
        ...user,
        ticketCount: ticketStatsMap[user._id.toString()]?.ticketCount || 0,
        latestBuyDate: ticketStatsMap[user._id.toString()]?.latestBuyDate || null,
        totalSpent: ticketStatsMap[user._id.toString()]?.totalSpent || 0,
      }));

      console.log("Fetched users with ticket stats:", usersWithStats);
      return usersWithStats;
    } catch (error) {
      throw new Error('Error fetching users from tickets');
    }
  }
}