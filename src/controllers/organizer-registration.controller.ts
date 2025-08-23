import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { OrganizerRegistrationService } from "../services/organizer-registration.service";

export class OrganizerRegistrationController {
  static createRegistration = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
        return;
      }

      const registrationData = req.body;
      const registration =
        await OrganizerRegistrationService.createRegistration(registrationData);

      res.status(201).json({
        success: true,
        message: "Registration submitted successfully",
        data: {
          id: registration._id,
          organizerName: registration.organizerName,
          eventName: registration.eventName,
          status: registration.status,
          createdAt: registration.createdAt,
        },
      });
    } catch (error: any) {
      console.error("Error creating organizer registration:", error);

      if (error.message.includes("already exists")) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Failed to submit registration",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  static getRegistrations = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const filters = {
        status: req.query.status as string,
        eventType: req.query.eventType as string,
        city: req.query.city as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        search: req.query.search as string,
      };

      Object.keys(filters).forEach((key) => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const result = await OrganizerRegistrationService.getRegistrations(
        page,
        limit,
        filters
      );

      res.status(200).json({
        success: true,
        message: "Registrations retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch registrations",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  static getRegistrationById = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      const registration =
        await OrganizerRegistrationService.getRegistrationById(id);

      res.status(200).json({
        success: true,
        message: "Registration retrieved successfully",
        data: registration,
      });
    } catch (error: any) {
      console.error("Error fetching registration:", error);

      if (error.message === "Registration not found") {
        res.status(404).json({
          success: false,
          message: "Registration not found",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Failed to fetch registration",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  static updateRegistrationStatus = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      const { status, notes, assignedTo } = req.body;

      const registration =
        await OrganizerRegistrationService.updateRegistrationStatus(
          id,
          status,
          notes,
          assignedTo
        );

      res.status(200).json({
        success: true,
        message: "Registration status updated successfully",
        data: registration,
      });
    } catch (error: any) {
      console.error("Error updating registration status:", error);

      if (error.message === "Registration not found") {
        res.status(404).json({
          success: false,
          message: "Registration not found",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Failed to update registration status",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  static assignRegistration = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      const { assignedTo } = req.body;

      const registration =
        await OrganizerRegistrationService.assignRegistration(id, assignedTo);

      res.status(200).json({
        success: true,
        message: "Registration assigned successfully",
        data: registration,
      });
    } catch (error: any) {
      console.error("Error assigning registration:", error);

      if (error.message === "Registration not found") {
        res.status(404).json({
          success: false,
          message: "Registration not found",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Failed to assign registration",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  static addNotes = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      const { notes } = req.body;

      const registration = await OrganizerRegistrationService.addNotes(
        id,
        notes
      );

      res.status(200).json({
        success: true,
        message: "Notes added successfully",
        data: registration,
      });
    } catch (error: any) {
      console.error("Error adding notes:", error);

      if (error.message === "Registration not found") {
        res.status(404).json({
          success: false,
          message: "Registration not found",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Failed to add notes",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  static getDashboardStats = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const stats = await OrganizerRegistrationService.getDashboardStats();

      res.status(200).json({
        success: true,
        message: "Dashboard statistics retrieved successfully",
        data: stats,
      });
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard statistics",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  static getEventTypes = async (req: Request, res: Response): Promise<void> => {
    try {
      const eventTypes = [
        { value: "concert", label: "Concert" },
        { value: "festival", label: "Festival" },
        { value: "conference", label: "Conference" },
        { value: "workshop", label: "Workshop" },
        { value: "seminar", label: "Seminar" },
        { value: "exhibition", label: "Exhibition" },
        { value: "sports", label: "Sports Event" },
        { value: "comedy", label: "Comedy Show" },
        { value: "theater", label: "Theater" },
        { value: "dance", label: "Dance Performance" },
        { value: "food", label: "Food & Dining" },
        { value: "community", label: "Community Event" },
        { value: "networking", label: "Networking" },
        { value: "charity", label: "Charity Event" },
        { value: "other", label: "Other" },
      ];

      res.status(200).json({
        success: true,
        message: "Event types retrieved successfully",
        data: eventTypes,
      });
    } catch (error: any) {
      console.error("Error fetching event types:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch event types",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  static getAudienceSizes = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const audienceSizes = [
        { value: "under_50", label: "Under 50 people" },
        { value: "50_100", label: "50-100 people" },
        { value: "100_500", label: "100-500 people" },
        { value: "500_1000", label: "500-1,000 people" },
        { value: "1000_5000", label: "1,000-5,000 people" },
        { value: "5000_plus", label: "5,000+ people" },
      ];

      res.status(200).json({
        success: true,
        message: "Audience sizes retrieved successfully",
        data: audienceSizes,
      });
    } catch (error: any) {
      console.error("Error fetching audience sizes:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch audience sizes",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  static exportRegistrations = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const filters = {
        status: req.query.status as string,
        eventType: req.query.eventType as string,
        city: req.query.city as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        search: req.query.search as string,
      };

      Object.keys(filters).forEach((key) => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const result = await OrganizerRegistrationService.getRegistrations(
        1,
        10000,
        filters
      );

      const csvHeaders = [
        "ID",
        "Organizer Name",
        "Contact Person",
        "Email",
        "Mobile",
        "Event Name",
        "Event Type",
        "Venue",
        "City",
        "Event Date",
        "Event Time",
        "Expected Audience",
        "Status",
        "Created At",
        "Assigned To",
        "Notes",
      ];

      const csvRows = result.registrations.map((reg) => [
        reg._id,
        reg.organizerName,
        reg.contactPersonName,
        reg.emailAddress,
        reg.mobileNumber,
        reg.eventName,
        reg.eventType,
        reg.venueName,
        reg.city,
        new Date(reg.eventDate).toLocaleDateString(),
        reg.eventTime,
        reg.expectedAudienceSize,
        reg.status,
        new Date(reg.createdAt).toLocaleDateString(),
        reg.assignedTo ? (reg.assignedTo as any).name : "",
        reg.notes || "",
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map((row) => row.map((field) => `"${field}"`).join(","))
        .join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="organizer-registrations-${
          new Date().toISOString().split("T")[0]
        }.csv"`
      );
      res.status(200).send(csvContent);
    } catch (error: any) {
      console.error("Error exporting registrations:", error);
      res.status(500).json({
        success: false,
        message: "Failed to export registrations",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };
}
