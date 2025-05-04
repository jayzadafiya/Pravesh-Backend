import * as express from "express";
import { UserController } from "../controllers/user.controller";
import protect from "../middleware/auth.middleware";

const ticketRouter = express.Router();

ticketRouter.get("/profile", protect, UserController.getUserByToken);

export default ticketRouter;
