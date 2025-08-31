import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

// Controller to get all users with ticket count
export const getAllUsersWithTickets = async (req: Request, res: Response) => {
  try {
    const users = await UserService.getAllUsersFromTickets();
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users with tickets',
    });
  }
};