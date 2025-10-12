import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import mongoose from "mongoose";
import { AuthRequest } from "../../interfaces/auth-request.interface";

export const getAllUsersWithTickets = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { eventIds, eventId, page = 1, active } = req.query;

    let eventObjectId: mongoose.Types.ObjectId[] = [];
    if (eventId && eventId !== "undefined" && typeof eventId === "string") {
      try {
        const singleEventId = new mongoose.Types.ObjectId(eventId);
        eventObjectId = [singleEventId];
      } catch (err) {
        console.error("Invalid eventId format:", eventId);
      }
    } else if (Array.isArray(eventIds) && eventIds.length) {
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

    let targetOrgId = new mongoose.Types.ObjectId(req?.organization?._id);

    const pageNumber =
      typeof page === "string" ? parseInt(page, 10) : Number(page);
    const limitNumber = 10;
    const { usersWithStats, count } = await UserService.getAllUsersFromTickets(
      eventObjectId,
      targetOrgId,
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

export const getAllUserStats = async (req: AuthRequest, res: Response) => {
  try {
    const { eventIds, eventId } = req.query;

    let eventObjectId: mongoose.Types.ObjectId[] = [];
    if (eventId && eventId !== "undefined" && typeof eventId === "string") {
      try {
        const singleEventId = new mongoose.Types.ObjectId(eventId);
        eventObjectId = [singleEventId];
      } catch (err) {
        console.error("Invalid eventId format:", eventId);
      }
    } else if (Array.isArray(eventIds) && eventIds.length) {
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

    let targetOrgId = new mongoose.Types.ObjectId(req?.organization?._id);

    const userStats = await UserService.getUserStats(
      eventObjectId,
      targetOrgId
    );
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
export const getAllTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { eventIds, eventId, page = 1 } = req.query;

    let eventObjectId: mongoose.Types.ObjectId[] = [];

    if (eventId && eventId !== "undefined" && typeof eventId === "string") {
      try {
        const singleEventId = new mongoose.Types.ObjectId(eventId);
        eventObjectId = [singleEventId];
      } catch (err) {
        console.error("Invalid eventId format:", eventId);
      }
    } else if (Array.isArray(eventIds) && eventIds.length) {
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
    let targetOrgId = new mongoose.Types.ObjectId(req?.organization?._id);
    const pageNumber =
      typeof page === "string" ? parseInt(page, 10) : Number(page);
    const limitNumber = 10;
    const fetchLimit = 11;

    const { transactions, count } = await UserService.getTransaction(
      eventObjectId,
      targetOrgId,
      pageNumber,
      fetchLimit
    );

    console.log(
      `Controller received ${transactions.length} transactions, total count: ${count}`
    );

    let isNextPageAvailable = false;
    if (transactions.length > limitNumber) {
      isNextPageAvailable = true;
      transactions.splice(limitNumber);
    }

    return res.status(200).json({
      success: true,
      data: transactions,
      count: count,
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

export const getTransactionStats = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.query;

    let eventObjectId: mongoose.Types.ObjectId[] = [];

    if (eventId && eventId !== "undefined" && typeof eventId === "string") {
      try {
        const singleEventId = new mongoose.Types.ObjectId(eventId);
        eventObjectId = [singleEventId];
      } catch (err) {
        console.error("Invalid eventId format:", eventId);
      }
    }

    let targetOrgId = new mongoose.Types.ObjectId(req?.organization?._id);

    const transactionStats = await UserService.getTransactionStats(
      eventObjectId,
      targetOrgId
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
