import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import mongoose from 'mongoose';

// Controller to get all users with ticket count
export const getAllUsersWithTickets = async (req: Request, res: Response) => {
  try {

    const { eventIds, page = 1, active } = req.query;
    const eventObjectId: mongoose.Types.ObjectId[] = Array.isArray(eventIds) && eventIds.length
      ? eventIds.map((ele) => new mongoose.Types.ObjectId(String(ele)))
      : [];
    const pageNumber = typeof page === 'string' ? parseInt(page, 10) : Number(page);
    const limitNumber = 10
    const {usersWithStats,count} = await UserService.getAllUsersFromTickets(
      eventObjectId,
      pageNumber,
      limitNumber,
      typeof active === 'string' ? active : ''
    );
    let isNextPageAvailable = false
    if (usersWithStats.length > limitNumber) {
      isNextPageAvailable = true
      usersWithStats.pop();
    }
    res.status(200).json({
      success: true,
      data: usersWithStats,
      pageCount: Math.ceil(count / limitNumber),
      isNextPageAvailable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users with tickets',
    });
  }
};

export const getAllUserStats = async (req: Request, res: Response) => {
  try {
    const { eventIds } = req.query;
    const eventObjectId: mongoose.Types.ObjectId[] = Array.isArray(eventIds) && eventIds.length
      ? eventIds.map((ele) => new mongoose.Types.ObjectId(String(ele)))
      : [];
    const userStats = await UserService.getUserStats(eventObjectId);
    return res.status(200).json({
      success: true,
      data: userStats,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users stats with tickets',
    });
  }

}
export const getAllTransaction = async (req: Request, res: Response) => {
  try {
    const { eventIds, organizationId,page=1 } = req.query;
    const eventObjectId: mongoose.Types.ObjectId[] = Array.isArray(eventIds) && eventIds.length
      ? eventIds.map((ele) => new mongoose.Types.ObjectId(String(ele)))
      : [];
    const pageNumber = typeof page === 'string' ? parseInt(page, 10) : Number(page);
    const limitNumber = 10
    const {transactions,count} = await UserService.getTransaction(eventObjectId, new mongoose.Types.ObjectId(String(organizationId)),pageNumber,limitNumber);
    let isNextPageAvailable = false
    if (transactions.length > limitNumber) {
      isNextPageAvailable = true
      transactions.pop();
    }
    return res.status(200).json({
      success: true,
      data: transactions,
      pageCount: Math.ceil(count / limitNumber),
      isNextPageAvailable
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users stats with tickets',
    });
  }
}

export const getTransactionStats = async (req: Request, res: Response) => {
  try {
    //totalRevenue
    //success
    //cancel
    //pending

    const { eventIds ,organizationId} = req.query;
    const eventObjectId: mongoose.Types.ObjectId[] = Array.isArray(eventIds) && eventIds.length
      ? eventIds.map((ele) => new mongoose.Types.ObjectId(String(ele)))
      : [];
    const transactionStats = await UserService.getTransactionStats(eventObjectId,new mongoose.Types.ObjectId(String(organizationId)));
    return res.status(200).json({
      success: true,
      data: transactionStats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users stats with tickets',
    });
  }
}

