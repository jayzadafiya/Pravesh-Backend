import { body } from "express-validator";

export const validateLogin = [
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .trim()
    .isMobilePhone("any", { strictMode: false })
    .withMessage("Phone number must be valid"),
];

export const validateOrganizationLogin = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .trim()
    .isEmail()
    .withMessage("Email must be valid"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

export const validateSetPassword = [
  body("token").notEmpty().withMessage("Token is required"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

export const validateSendSetupEmail = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .trim()
    .isEmail()
    .withMessage("Email must be valid"),
];
