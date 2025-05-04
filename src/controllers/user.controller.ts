import { BadRequestException } from "../utils/exceptions";

class userController {
  getUserByToken = async (req: any, res: any) => {
    try {
      if (!req.user) {
        throw new BadRequestException("User not found");
      }
      return res.status(200).send(req.user);
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };
}

export const UserController = new userController();
