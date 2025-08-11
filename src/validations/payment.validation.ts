import { body, param } from "express-validator";

// Validation for creating Cashfree payment order
export const validateCreatePaymentOrder = [
  body("amount")
    .isNumeric()
    .withMessage("Amount must be a number")
    .custom((value) => {
      if (value <= 1) {
        throw new Error("Amount must be greater than 1");
      }
      return true;
    }),
  body("currency")
    .optional()
    .isString()
    .withMessage("Currency must be a string")
    .isIn(["INR", "USD", "EUR"])
    .withMessage("Currency must be one of: INR, USD, EUR"),
  body("selectedTickets")
    .isArray({ min: 1 })
    .withMessage("Selected tickets must be a non-empty array"),
  body("selectedTickets.*.ticketTypes")
    .isArray({ min: 1 })
    .withMessage("Each ticket group must have at least one ticket type"),
  body("selectedTickets.*.ticketTypes.*.count")
    .isNumeric()
    .withMessage("Ticket count must be a number")
    .custom((value) => {
      if (value < 1) {
        throw new Error("Ticket count must be at least 1");
      }
      return true;
    }),
];

// Validation for verifying Cashfree payment
export const validateVerifyPayment = [
  body("orderId")
    .notEmpty()
    .withMessage("Order ID is required")
    .isString()
    .withMessage("Order ID must be a string"),
  body("orderAmount")
    .notEmpty()
    .withMessage("Order amount is required")
    .isString()
    .withMessage("Order amount must be a string"),
  body("referenceId")
    .notEmpty()
    .withMessage("Reference ID (Payment ID) is required")
    .isString()
    .withMessage("Reference ID must be a string"),
  body("paymentStatus")
    .notEmpty()
    .withMessage("Payment status is required")
    .isIn(["SUCCESS", "FAILED", "CANCELLED", "PENDING"])
    .withMessage("Invalid payment status"),
  body("signature")
    .notEmpty()
    .withMessage("Payment signature is required")
    .isString()
    .withMessage("Signature must be a string"),
  body("selectedTickets")
    .isArray({ min: 1 })
    .withMessage("Selected tickets must be a non-empty array"),
  body("amount")
    .isNumeric()
    .withMessage("Amount must be a number")
    .custom((value) => {
      if (value <= 1) {
        throw new Error("Amount must be greater than 1");
      }
      return true;
    }),
];

// Validation for getting payment status
export const validateGetPaymentStatus = [
  param("orderId")
    .notEmpty()
    .withMessage("Order ID is required")
    .isString()
    .withMessage("Order ID must be a string"),
];

// Validation for webhook data (less strict as it comes from Cashfree)
export const validateWebhookData = [
  body("orderId").notEmpty().withMessage("Order ID is required"),
  body("orderAmount").notEmpty().withMessage("Order amount is required"),
  body("referenceId").notEmpty().withMessage("Reference ID is required"),
  body("paymentStatus").notEmpty().withMessage("Payment status is required"),
  body("signature").notEmpty().withMessage("Signature is required"),
];
