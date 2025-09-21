import { Request, Response } from "express";
import EventModel from "../../models/Event.model";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "../../utils/exceptions";
import { AuthRequest } from "../../interfaces/auth-request.interface";
import { EmailService } from "../../services/email.service";

class VerificationController {
  submitForVerification = async (req: AuthRequest, res: Response) => {
    try {
      const { eventId } = req.params;

      const event = await EventModel.findById(eventId);
      if (!event) {
        throw new NotFoundException("Event not found");
      }

      if (event.organization.toString() !== req?.organization?._id.toString()) {
        throw new ForbiddenException(
          "You don't have permission to submit this event"
        );
      }

      event.verificationStatus = "pending";
      event.verificationRequestedAt = new Date();
      event.verificationMessage = "";
      await event.save();

      res.status(200).json({
        message: "Event submitted for verification successfully",
        event: {
          id: event._id,
          name: event.name,
          verificationStatus: event.verificationStatus,
          verificationRequestedAt: event.verificationRequestedAt,
        },
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  getPendingEvents = async (req: AuthRequest, res: Response) => {
    try {
      if (
        !req.organization ||
        (req.organization as any).role !== "superAdmin"
      ) {
        throw new ForbiddenException(
          "User do not have to permission to access this resource"
        );
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const events = await EventModel.find({
        verificationStatus: "pending",
        isDeleted: false,
      })
        .populate("organization", "name email")
        .sort({ verificationRequestedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await EventModel.countDocuments({
        verificationStatus: "pending",
        isDeleted: false,
      });

      res.status(200).json({
        events,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit,
        },
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  approveEvent = async (req: AuthRequest, res: Response) => {
    try {
      const { eventId } = req.params;

      if (
        !req.organization ||
        (req.organization as any).role !== "superAdmin"
      ) {
        throw new ForbiddenException("Only superadmin can approve events");
      }

      const event = await EventModel.findById(eventId).populate(
        "organization",
        "name email"
      );
      if (!event) {
        throw new NotFoundException("Event not found");
      }

      if (event.verificationStatus !== "pending") {
        throw new BadRequestException("Event is not pending verification");
      }

      event.verificationStatus = "approved";
      event.isPublished = true;
      event.verificationProcessedAt = new Date();
      event.verificationProcessedBy = req.organization.id;
      event.verificationMessage = "Event approved and published successfully";
      await event.save();

      try {
        await EmailService.sendEventApprovalEmail(
          (event.organization as any).email,
          event.name,
          (event.organization as any).name,
          event._id.toString()
        );
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
      }

      res.status(200).json({
        message: "Event approved and published successfully",
        event: {
          id: event._id,
          name: event.name,
          verificationStatus: event.verificationStatus,
          isPublished: event.isPublished,
        },
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  rejectEvent = async (req: AuthRequest, res: Response) => {
    try {
      const { eventId } = req.params;
      const { message } = req.body;

      if (
        !req.organization ||
        (req.organization as any).role !== "superAdmin"
      ) {
        throw new ForbiddenException(
          "User do not have to permission to access this resource"
        );
      }

      if (!message || message.trim().length === 0) {
        throw new BadRequestException("Rejection message is required");
      }

      const event = await EventModel.findById(eventId).populate(
        "organization",
        "name email"
      );
      if (!event) {
        throw new NotFoundException("Event not found");
      }

      if (event.verificationStatus !== "pending") {
        throw new BadRequestException("Event is not pending verification");
      }

      event.verificationStatus = "rejected";
      event.isPublished = false;
      event.verificationProcessedAt = new Date();
      event.verificationProcessedBy = req.organization.id;
      event.verificationMessage = message.trim();
      await event.save();

      try {
        await EmailService.sendEventRejectionEmail(
          (event.organization as any).email,
          event.name,
          (event.organization as any).name,
          message.trim()
        );
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
      }

      res.status(200).json({
        message: "Event rejected successfully",
        event: {
          id: event._id,
          name: event.name,
          verificationStatus: event.verificationStatus,
          verificationMessage: event.verificationMessage,
        },
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  getVerificationStatus = async (req: AuthRequest, res: Response) => {
    try {
      const { eventId } = req.params;

      const event = await EventModel.findById(eventId)
        .select(
          "name organization verificationStatus verificationMessage verificationRequestedAt verificationProcessedAt isPublished"
        )
        .populate("verificationProcessedBy", "name email");

      if (!event) {
        throw new NotFoundException("Event not found");
      }

      const isOwner =
        event.organization.toString() === req?.organization?._id.toString();
      const isAdmin =
        req.organization && (req.organization as any).role === "superAdmin";

      if (!isOwner && !isAdmin) {
        throw new ForbiddenException(
          "You don't have permission to view this event's verification status"
        );
      }

      res.status(200).json({
        eventId: event._id,
        eventName: event.name,
        verificationStatus: event.verificationStatus,
        verificationMessage: event.verificationMessage,
        verificationRequestedAt: event.verificationRequestedAt,
        verificationProcessedAt: event.verificationProcessedAt,
        verificationProcessedBy: event.verificationProcessedBy,
        isPublished: event.isPublished,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };
}

export const EventVerificationController = new VerificationController();
