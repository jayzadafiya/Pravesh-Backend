import { body, query, param } from "express-validator";

export const validateAddContributor = [
  body("eventId")
    .notEmpty()
    .withMessage("Event ID is required")
    .isMongoId()
    .withMessage("Event ID must be a valid MongoDB ObjectId"),
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("organizationId")
    .optional()
    .isMongoId()
    .withMessage("Organization ID must be a valid MongoDB ObjectId"),
];

export const validateVerifyContributor = [
  query("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  query("token")
    .notEmpty()
    .withMessage("Verification token is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("Token must be 6 characters long"),
];

export const validateContributorLogin = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("eventPassword")
    .notEmpty()
    .withMessage("Event password is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("Event password must be 6 characters long"),
];

export const validateContributorId = [
  param("contributorId")
    .isMongoId()
    .withMessage("Contributor ID must be a valid MongoDB ObjectId"),
];

export const validateEventId = [
  param("eventId")
    .isMongoId()
    .withMessage("Event ID must be a valid MongoDB ObjectId"),
];

export const validateUpdateStatus = [
  ...validateContributorId,
  body("status")
    .isIn(["active", "inactive"])
    .withMessage("Status must be either 'active' or 'inactive'"),
  body("eventId")
    .notEmpty()
    .withMessage("Event ID is required")
    .isMongoId()
    .withMessage("Event ID must be a valid MongoDB ObjectId"),
];

export const validateRemoveFromEvent = [
  ...validateContributorId,
  body("eventId")
    .notEmpty()
    .withMessage("Event ID is required")
    .isMongoId()
    .withMessage("Event ID must be a valid MongoDB ObjectId"),
];

export const validateResendEmail = [
  ...validateContributorId,
  body("eventId")
    .notEmpty()
    .withMessage("Event ID is required")
    .isMongoId()
    .withMessage("Event ID must be a valid MongoDB ObjectId"),
];
