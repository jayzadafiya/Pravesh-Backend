import * as express from "express";
import protect from "../middleware/auth.middleware";
import { PaymentController } from "../controllers/payment.controller";
import { validateRequest } from "../middleware/validate-request";
import {
  validateCreatePaymentOrder,
  validateVerifyPayment,
  validateGetPaymentStatus,
  validateWebhookData,
} from "../validations/payment.validation";

import { createRateLimiter, securityConfig } from "../config/security.config";

const paymentRouter = express.Router();

// Create payment limiter instance
const paymentLimiter = createRateLimiter(securityConfig.rateLimiting.payment);

// RAZORPAY ROUTES (COMMENTED - KEEPING FOR BACKWARD COMPATIBILITY)
// paymentRouter.post(
//   "/get-payment-intent",
//   protect,
//   PaymentController.processPayment as any
// );
// paymentRouter.post(
//   "/check-and-add-tickets",
//   protect,
//   PaymentController.checkAndAddTickets as any
// );

// CASHFREE ROUTES (NEW IMPLEMENTATION)
paymentRouter.post(
  "/cashfree/create-order",
  protect,
  paymentLimiter,
  validateCreatePaymentOrder,
  validateRequest,
  PaymentController.createCashfreePaymentOrder as any
);

paymentRouter.post(
  "/cashfree/verify-payment",
  protect,
  paymentLimiter,
  PaymentController.verifyCashfreePaymentAndAddTickets as any
);

// Webhook endpoint - No auth required, raw body parsing for signature verification
paymentRouter.post(
  "/cashfree/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.handleCashfreeWebhook as any
);

paymentRouter.get(
  "/cashfree/status/:orderId",
  protect,
  validateGetPaymentStatus,
  validateRequest,
  PaymentController.getCashfreePaymentStatus as any
);

export default paymentRouter;
