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
userRouter.get("/tickets", protect, UserController.getUserAssignTickets as any);

userRouter.post(
  "/add-free-tickets",
  protect,
  UserController.addFreeTicket as any
);

userRouter.put("/profile", protect, UserController.updateUserDetails as any);
userRouter.put("/cart", protect, UserController.updateCartItems as any);

export default userRouter;
