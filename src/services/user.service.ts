import mongoose from "mongoose";
import UserModel from "../models/User.model";
import { createOne, getOne } from "../utils/helper";
import { IUser } from "../interfaces/user.interface";

class userService {
  async getUserByPhone(phone: string) {
    return await UserModel.find({ phone: phone });
  }

  async cerateUser(phone: any) {
    return await createOne(UserModel, { phone });
  }
}
export const UserService = new userService();
