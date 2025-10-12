import moment from "moment";
import { getAll, getOne } from "../../utils/helper";
import EventModel from "../../models/Event.model";
import UserTicket from "../../models/User-ticket.model";
import mongoose from "mongoose";
import { IEvent } from "../../interfaces/event.interface";

class adminEventService {
  getEvent = async (id: string): Promise<IEvent | null> => {
    console.log("Fetching event with ID:", id);
    return await getOne(EventModel, new mongoose.Types.ObjectId(id));
  };

  getEventList = async (organizationId: mongoose.Types.ObjectId) => {
    const events = await EventModel.find({ organization: organizationId });
    const now = moment();

    const eventIds = events.map((event) => event._id);

    console.log(eventIds);
    const ticketStats = await UserTicket.aggregate([
      {
        $match: {
          event: { $in: eventIds },
        },
      },
      {
        $group: {
          _id: "$event",
          totalTickets: { $sum: "$quantity" },
          totalRevenue: { $sum: "$price" },
        },
      },
    ]);

    const ticketStatsMap = ticketStats.reduce((acc, curr) => {
      acc[curr._id.toString()] = {
        totalTickets: curr.totalTickets,
        totalRevenue: curr.totalRevenue,
      };
      return acc;
    }, {} as Record<string, { totalTickets: number; totalRevenue: number }>);

    const updatedEvents = events.map((event) => {
      let status = "pending";

      if (event.isPublished) {
        const startDate = moment(event.startDate);
        const endDate = moment(event.endDate);

        if (startDate.isAfter(now)) {
          status = "upcoming";
        } else if (
          startDate.isSameOrBefore(now) &&
          endDate.isSameOrAfter(now)
        ) {
          status = "live";
        } else if (endDate.isBefore(now)) {
          status = "closed";
        }
      }

      const stats = ticketStatsMap[event._id.toString()] || {
        totalTickets: 0,
        totalRevenue: 0,
      };

      return {
        ...event.toObject(),
        status,
        totalTickets: stats.totalTickets,
        totalRevenue: stats.totalRevenue,
      };
    });

    return updatedEvents;
  };

  getEventStats = async (organizationId: mongoose.Types.ObjectId) => {
    const totalEvents = await EventModel.countDocuments({
      organization: organizationId,
      isDeleted: false,
    });

    const events = await EventModel.find({
      organization: organizationId,
      isDeleted: false,
    }).lean();

    const now = moment();

    const eventsWithStatus = events.map((event) => {
      let status = "pending";
      if (event.isPublished) {
        const startDate = moment(event.startDate);
        const endDate = moment(event.endDate);

        if (startDate.isAfter(now)) {
          status = "upcoming";
        } else if (
          startDate.isSameOrBefore(now) &&
          endDate.isSameOrAfter(now)
        ) {
          status = "live";
        } else if (endDate.isBefore(now)) {
          status = "closed";
        }
      }
      return { ...event, status };
    });

    const activeEvents = eventsWithStatus.filter(
      (e) => e.status === "live"
    ).length;

    if (events.length === 0) {
      return {
        totalEvents: 0,
        activeEvents: 0,
        totalTicketsSold: 0,
        totalRevenue: 0,
      };
    }

    const eventIds = events.map((event) => event._id);

    const ticketStats = await UserTicket.aggregate([
      {
        $match: {
          event: { $in: eventIds },
        },
      },
      {
        $group: {
          _id: null,
          totalTicketsSold: { $sum: "$quantity" },
          totalRevenue: { $sum: "$price" },
        },
      },
    ]);

    return {
      totalEvents,
      activeEvents,
      totalTicketsSold: ticketStats[0]?.totalTicketsSold || 0,
      totalRevenue: ticketStats[0]?.totalRevenue || 0,
    };
  };

  removeEntityById = async (
    eventId: mongoose.Types.ObjectId,
    profile: mongoose.Types.ObjectId,
    type: "artist" | "sponsor" | "partner"
  ) => {
    const update =
      type === "artist"
        ? { $pull: { artists: { _id: profile } } }
        : type === "sponsor"
        ? { $pull: { sponsors: { _id: profile } } }
        : { $pull: { partners: { _id: profile } } };
    const event = await EventModel.findOneAndUpdate({ _id: eventId }, update, {
      new: true,
    });

    if (!event) {
      throw new Error("Event not found or no matching artist/sponsor");
    }

    return event;
  };

  getAllEventList = async (
    page: number,
    limit: number,
    organizationId: mongoose.Types.ObjectId
  ) => {
    const skip = (page - 1) * limit;
    const now = moment();

    const events = await EventModel.find({ organization: organizationId })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await EventModel.countDocuments({
      organization: organizationId,
    });

    if (!events.length) {
      return {
        events: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const eventIds = events.map((event) => event._id);

    const ticketStats = await UserTicket.aggregate([
      {
        $match: { event: { $in: eventIds } },
      },
      {
        $group: {
          _id: "$event",
          totalTickets: { $sum: "$quantity" },
          totalRevenue: { $sum: "$price" },
        },
      },
    ]);

    const ticketStatsMap = ticketStats.reduce((acc, curr) => {
      acc[curr._id.toString()] = {
        totalTickets: curr.totalTickets,
        totalRevenue: curr.totalRevenue,
      };
      return acc;
    }, {} as Record<string, { totalTickets: number; totalRevenue: number }>);

    const updatedEvents = events.map((event) => {
      let status = "pending";

      if (event.isPublished) {
        const startDate = moment(event.startDate);
        const endDate = moment(event.endDate);

        if (startDate.isAfter(now)) {
          status = "upcoming";
        } else if (
          startDate.isSameOrBefore(now) &&
          endDate.isSameOrAfter(now)
        ) {
          status = "live";
        } else if (endDate.isBefore(now)) {
          status = "closed";
        }
      }

      const stats = ticketStatsMap[event._id.toString()] || {
        totalTickets: 0,
        totalRevenue: 0,
      };

      return {
        ...event,
        status,
        totalTickets: stats.totalTickets,
        totalRevenue: stats.totalRevenue,
      };
    });

    return {
      events: updatedEvents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  };

  getTicketsAndRevenueChartData = async () => {
    // --- Line Chart Data (tickets per day, last 30 days) ---
    const today = moment().startOf("day");
    const startDate = moment(today).subtract(29, "days");

    const ticketCounts = await UserTicket.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate.toDate(),
            $lte: today.endOf("day").toDate(),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: "$quantity" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const countMap = ticketCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    const lineChart: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const date = moment(startDate).add(i, "days").format("YYYY-MM-DD");
      lineChart[date] = countMap[date] || 0;
    }

    // --- Column Chart Data (revenue per event) ---
    const revenueStats = await UserTicket.aggregate([
      {
        $group: {
          _id: "$event",
          totalRevenue: { $sum: "$price" },
        },
      },
    ]);

    const revenueMap = revenueStats.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.totalRevenue;
      return acc;
    }, {} as Record<string, number>);

    const events = await EventModel.find().lean();

    const columnChart = events.map((event) => ({
      eventId: event._id,
      name: event.name,
      totalRevenue: revenueMap[event._id.toString()] || 0,
    }));

    // --- Final Response ---
    return {
      lineChart,
      columnChart,
    };
  };

  getTodayEvent = async (organization: mongoose.Types.ObjectId) => {
    const events = await EventModel.find({ organization: organization });
    return events;
  };
}

export const AdminEventService = new adminEventService();
