import mongoose from "mongoose";
import UserModel from "../models/User.model";
import { getOne } from "../utils/helper";

class userService {
  async getUserByPhone(phone: string) {
    return await UserModel.find({ phone: phone });
  }
}
export const UserService = new userService();
