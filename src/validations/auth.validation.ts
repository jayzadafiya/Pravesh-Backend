import { body } from "express-validator";

export const validateLogin = [
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .trim()
    .isMobilePhone("any", { strictMode: false })
    .withMessage("Phone number must be valid"),
];
