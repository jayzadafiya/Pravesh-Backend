import { body, query, param } from "express-validator";

export const createRegistrationValidation = [
  body("organizerName")
    .trim()
    .notEmpty()
    .withMessage("Organizer name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Organizer name must be between 2 and 100 characters"),

  body("contactPersonName")
    .trim()
    .notEmpty()
    .withMessage("Contact person name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Contact person name must be between 2 and 100 characters"),

  body("mobileNumber")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required")
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage("Please provide a valid mobile number"),

  body("emailAddress")
    .trim()
    .notEmpty()
    .withMessage("Email address is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("socialMediaLinks")
    .optional()
    .isArray()
    .withMessage("Social media links must be an array"),

  body("socialMediaLinks.*")
    .optional()
    .trim()
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Each social media link must be a valid URL"),

  body("eventName")
    .trim()
    .notEmpty()
    .withMessage("Event name is required")
    .isLength({ min: 2, max: 200 })
    .withMessage("Event name must be between 2 and 200 characters"),

  body("eventType")
    .trim()
    .notEmpty()
    .withMessage("Event type is required")
    .isIn([
      "concert",
      "festival",
      "conference",
      "workshop",
      "seminar",
      "exhibition",
      "sports",
      "comedy",
      "theater",
      "dance",
      "food",
      "community",
      "networking",
      "charity",
      "other",
    ])
    .withMessage("Please select a valid event type"),

  body("venueName")
    .trim()
    .notEmpty()
    .withMessage("Venue name is required")
    .isLength({ min: 2, max: 200 })
    .withMessage("Venue name must be between 2 and 200 characters"),

  body("venueAddress")
    .trim()
    .notEmpty()
    .withMessage("Venue address is required")
    .isLength({ min: 10, max: 500 })
    .withMessage("Venue address must be between 10 and 500 characters"),

  body("city")
    .trim()
    .notEmpty()
    .withMessage("City is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("City must be between 2 and 100 characters"),

  body("eventDate")
    .notEmpty()
    .withMessage("Event date is required")
    .isISO8601()
    .withMessage("Please provide a valid date in ISO format")
    .custom((value) => {
      const eventDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (eventDate < today) {
        throw new Error("Event date cannot be in the past");
      }

      // Check if event date is too far in the future (2 years)
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 2);

      if (eventDate > maxDate) {
        throw new Error("Event date cannot be more than 2 years in the future");
      }

      return true;
    }),

  body("eventTime")
    .trim()
    .notEmpty()
    .withMessage("Event time is required")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Please provide a valid time in HH:MM format"),

  body("expectedAudienceSize")
    .notEmpty()
    .withMessage("Expected audience size is required")
    .isIn([
      "under_50",
      "50_100",
      "100_500",
      "500_1000",
      "1000_5000",
      "5000_plus",
    ])
    .withMessage("Please select a valid audience size range"),

  body("preferredContactDate")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid preferred contact date")
    .custom((value) => {
      if (value) {
        const contactDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (contactDate < today) {
          throw new Error("Preferred contact date cannot be in the past");
        }

        // Check if contact date is reasonable (within 30 days)
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);

        if (contactDate > maxDate) {
          throw new Error(
            "Preferred contact date should be within the next 30 days"
          );
        }
      }
      return true;
    }),
];

export const updateStatusValidation = [
  param("id")
    .notEmpty()
    .withMessage("Registration ID is required")
    .isMongoId()
    .withMessage("Invalid registration ID format"),

  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["pending", "contacted", "in_progress", "completed", "rejected"])
    .withMessage("Invalid status value"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes cannot exceed 1000 characters"),

  body("assignedTo")
    .optional()
    .isMongoId()
    .withMessage("Invalid assigned user ID format"),
];

export const assignRegistrationValidation = [
  param("id")
    .notEmpty()
    .withMessage("Registration ID is required")
    .isMongoId()
    .withMessage("Invalid registration ID format"),

  body("assignedTo")
    .notEmpty()
    .withMessage("Assigned user ID is required")
    .isMongoId()
    .withMessage("Invalid assigned user ID format"),
];

export const addNotesValidation = [
  param("id")
    .notEmpty()
    .withMessage("Registration ID is required")
    .isMongoId()
    .withMessage("Invalid registration ID format"),

  body("notes")
    .trim()
    .notEmpty()
    .withMessage("Notes are required")
    .isLength({ min: 1, max: 1000 })
    .withMessage("Notes must be between 1 and 1000 characters"),
];

export const getRegistrationsValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),

  query("status")
    .optional()
    .trim()
    .isIn(["pending", "contacted", "in_progress", "completed", "rejected"])
    .withMessage("Invalid status filter"),

  query("eventType")
    .optional()
    .trim()
    .isIn([
      "concert",
      "festival",
      "conference",
      "workshop",
      "seminar",
      "exhibition",
      "sports",
      "comedy",
      "theater",
      "dance",
      "food",
      "community",
      "networking",
      "charity",
      "other",
    ])
    .withMessage("Invalid event type filter"),

  query("city")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("City filter must be between 2 and 100 characters"),

  query("dateFrom")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid date format for dateFrom"),

  query("dateTo")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid date format for dateTo"),

  query("search")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Search term must be between 2 and 100 characters"),
];

export const getRegistrationByIdValidation = [
  param("id")
    .notEmpty()
    .withMessage("Registration ID is required")
    .isMongoId()
    .withMessage("Invalid registration ID format"),
];

// Custom validation middleware to check date range
export const validateDateRange = (req: any, res: any, next: any) => {
  const { dateFrom, dateTo } = req.query;

  if (dateFrom && dateTo) {
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);

    if (fromDate > toDate) {
      return res.status(400).json({
        success: false,
        message: "dateFrom cannot be later than dateTo",
        errors: [
          {
            field: "dateRange",
            message: "dateFrom cannot be later than dateTo",
          },
        ],
      });
    }

    // Check if date range is reasonable (max 2 years)
    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 730) {
      // 2 years
      return res.status(400).json({
        success: false,
        message: "Date range cannot exceed 2 years",
        errors: [
          {
            field: "dateRange",
            message: "Date range cannot exceed 2 years",
          },
        ],
      });
    }
  }

  next();
};

// Email validation middleware for unique email check
export const validateUniqueEmail = async (req: any, res: any, next: any) => {
  try {
    const { emailAddress } = req.body;

    if (emailAddress) {
      const { OrganizerRegistrationService } = await import(
        "../services/organizer-registration.service"
      );

      // This will be handled in the service layer
      // Just proceed for now
    }

    next();
  } catch (error) {
    next();
  }
};
