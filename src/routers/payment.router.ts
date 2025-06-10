import * as express from "express";
import protect from "../middleware/auth.middleware";
import { PaymentController } from "../controllers/payment.controller";

const paymentRouter = express.Router();

paymentRouter.post(
  "/get-payment-intent",
  protect,
  PaymentController.processPayment as any
);
paymentRouter.post(
  "/check-and-add-tickets",
  protect,
  PaymentController.checkAndAddTickets as any
);

export default paymentRouter;
