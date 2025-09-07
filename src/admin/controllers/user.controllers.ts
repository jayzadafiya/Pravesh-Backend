import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import mongoose from "mongoose";

export const getAllUsersWithTickets = async (req: Request, res: Response) => {
  try {
    const { eventIds, eventId, page = 1, active } = req.query;

    let eventObjectId: mongoose.Types.ObjectId[] = [];

    // Handle single eventId parameter
    if (eventId && typeof eventId === "string") {
      try {
        const singleEventId = new mongoose.Types.ObjectId(eventId);
        eventObjectId = [singleEventId];
      } catch (err) {
        console.error("Invalid eventId format:", eventId);
      }
    }
    // Handle eventIds array if eventId is not provided
    else if (Array.isArray(eventIds) && eventIds.length) {
      eventObjectId = eventIds
        .map((ele) => {
          try {
            return new mongoose.Types.ObjectId(String(ele));
          } catch (err) {
            console.error("Invalid eventId in array:", ele);
            return null;
          }
        })
        .filter((id) => id !== null) as mongoose.Types.ObjectId[];
    }

    const pageNumber =
      typeof page === "string" ? parseInt(page, 10) : Number(page);
    const limitNumber = 10;
    const { usersWithStats, count } = await UserService.getAllUsersFromTickets(
      eventObjectId,
      pageNumber,
      limitNumber,
      typeof active === "string" ? active : ""
    );
    let isNextPageAvailable = false;
    if (usersWithStats.length > limitNumber) {
      isNextPageAvailable = true;
      usersWithStats.pop();
    }
    res.status(200).json({
      success: true,
      data: usersWithStats,
      pageCount: Math.ceil(count / limitNumber),
      isNextPageAvailable,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users with tickets",
    });
  }
};

export const getAllUserStats = async (req: Request, res: Response) => {
  try {
    const { eventIds, eventId } = req.query;

    let eventObjectId: mongoose.Types.ObjectId[] = [];

    // Handle single eventId parameter
    if (eventId && typeof eventId === "string") {
      try {
        const singleEventId = new mongoose.Types.ObjectId(eventId);
        eventObjectId = [singleEventId];
      } catch (err) {
        console.error("Invalid eventId format:", eventId);
      }
    }
    // Handle eventIds array if eventId is not provided
    else if (Array.isArray(eventIds) && eventIds.length) {
      eventObjectId = eventIds
        .map((ele) => {
          try {
            return new mongoose.Types.ObjectId(String(ele));
          } catch (err) {
            console.error("Invalid eventId in array:", ele);
            return null;
          }
        })
        .filter((id) => id !== null) as mongoose.Types.ObjectId[];
    }

    const userStats = await UserService.getUserStats(eventObjectId);
    return res.status(200).json({
      success: true,
      data: userStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users stats with tickets",
    });
  }
};
export const getAllTransaction = async (req: Request, res: Response) => {
  try {
    const { eventIds, eventId, page = 1 } = req.query;

    let eventObjectId: mongoose.Types.ObjectId[] = [];

    // Handle single eventId parameter
    if (eventId && typeof eventId === "string") {
      try {
        const singleEventId = new mongoose.Types.ObjectId(eventId);
        eventObjectId = [singleEventId];
      } catch (err) {
        console.error("Invalid eventId format:", eventId);
      }
    }
    // Handle eventIds array if eventId is not provided
    else if (Array.isArray(eventIds) && eventIds.length) {
      eventObjectId = eventIds
        .map((ele) => {
          try {
            return new mongoose.Types.ObjectId(String(ele));
          } catch (err) {
            console.error("Invalid eventId in array:", ele);
            return null;
          }
        })
        .filter((id) => id !== null) as mongoose.Types.ObjectId[];
    }

    const pageNumber =
      typeof page === "string" ? parseInt(page, 10) : Number(page);
    // Use a higher limit to ensure we get all transactions for the requested page
    const limitNumber = 10;
    const fetchLimit = 11; // Fetch one extra to check if there's a next page

    const { transactions, count } = await UserService.getTransaction(
      eventObjectId,
      pageNumber,
      fetchLimit // Use fetchLimit instead of limitNumber
    );

    console.log(
      `Controller received ${transactions.length} transactions, total count: ${count}`
    );

    let isNextPageAvailable = false;
    if (transactions.length > limitNumber) {
      isNextPageAvailable = true;
      // Remove the extra item we fetched to check for next page
      transactions.splice(limitNumber);
    }

    return res.status(200).json({
      success: true,
      data: transactions,
      count: count, // Include the total count
      pageCount: Math.ceil(count / limitNumber),
      isNextPageAvailable,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users stats with tickets",
    });
  }
};

export const getTransactionStats = async (req: Request, res: Response) => {
  try {
    //totalRevenue
    //success
    //cancel
    //pending

    const { eventIds, eventId, organizationId } = req.query;

    let eventObjectId: mongoose.Types.ObjectId[] = [];

    if (eventId && typeof eventId === "string") {
      try {
        const singleEventId = new mongoose.Types.ObjectId(eventId);
        eventObjectId = [singleEventId];
      } catch (err) {
        console.error("Invalid eventId format:", eventId);
      }
    }

    const transactionStats = await UserService.getTransactionStats(
      eventObjectId
    );
    return res.status(200).json({
      success: true,
      data: transactionStats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users stats with tickets",
    });
  }
};
