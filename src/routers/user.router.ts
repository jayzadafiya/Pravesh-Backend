import * as express from "express";
import { UserController } from "../controllers/user.controller";
import protect from "../middleware/auth.middleware";

const userRouter = express.Router();

userRouter.get("/profile", protect, UserController.getUserByToken);
userRouter.get("/cart", protect, UserController.getCartItems as any);
userRouter.get(
  "/cart-item/:venueId",
  protect,
  UserController.getSelectedTickets as any
);

userRouter.put("/cart", protect, UserController.updateCartItems as any);

export default userRouter;
