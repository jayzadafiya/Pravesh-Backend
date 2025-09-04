import { body } from "express-validator";

export const verify = [
    body("userId")
        .notEmpty()
        .withMessage("User Id is required")
        .isMongoId()
        .withMessage("User Id must be mongo id"),
    body("eventId")
        .notEmpty()
        .withMessage("EVent Id is required")
        .isMongoId()
        .withMessage("Event Id must be mongo id"),
];

export const checkedInUser = [
    body("userTicketIds")
        .isArray()
        .withMessage("User Ticket Ids is required")
        .notEmpty()
        .withMessage("User Ticket Ids is required")
]