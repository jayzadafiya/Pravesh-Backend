import OrganizerRegistration from "../models/OrganizerRegistration.model";
import { IOrganizerRegistration } from "../interfaces/organizer-registration.interface";
import { EmailService } from "./email.service";

export class OrganizerRegistrationService {
  static createRegistration = async (
    registrationData: Partial<IOrganizerRegistration>
  ): Promise<IOrganizerRegistration> => {
    const existingRegistration = await OrganizerRegistration.findOne({
      emailAddress: registrationData.emailAddress,
      status: { $in: ["pending", "contacted", "in_progress"] },
    });

    if (existingRegistration) {
      throw new Error(
        "A registration with this email already exists and is being processed"
      );
    }

    const registration = new OrganizerRegistration(registrationData);
    await registration.save();

    await EmailService.sendConfirmationEmail(registration);

    await EmailService.sendAdminNotificationEmail(registration);

    return registration;
  };

  static getRegistrations = async (
    page: number = 1,
    limit: number = 10,
    filters: any = {}
  ): Promise<{
    registrations: IOrganizerRegistration[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> => {
    const skip = (page - 1) * limit;

    // Build filter query
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.eventType) {
      query.eventType = filters.eventType;
    }

    if (filters.city) {
      query.city = { $regex: filters.city, $options: "i" };
    }

    if (filters.dateFrom || filters.dateTo) {
      query.eventDate = {};
      if (filters.dateFrom) {
        query.eventDate.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        query.eventDate.$lte = new Date(filters.dateTo);
      }
    }

    if (filters.search) {
      query.$or = [
        { organizerName: { $regex: filters.search, $options: "i" } },
        { contactPersonName: { $regex: filters.search, $options: "i" } },
        { eventName: { $regex: filters.search, $options: "i" } },
        { emailAddress: { $regex: filters.search, $options: "i" } },
      ];
    }

    const [registrations, total] = await Promise.all([
      OrganizerRegistration.find(query)
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      OrganizerRegistration.countDocuments(query),
    ]);

    return {
      registrations,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  };

  static getRegistrationById = async (
    id: string
  ): Promise<IOrganizerRegistration> => {
    const registration = await OrganizerRegistration.findById(id).populate(
      "assignedTo",
      "name email"
    );

    if (!registration) {
      throw new Error("Registration not found");
    }

    return registration;
  };

  static updateRegistrationStatus = async (
    id: string,
    status: string,
    notes?: string,
    assignedTo?: string
  ): Promise<IOrganizerRegistration> => {
    const updateData: any = { status };

    if (notes) {
      updateData.notes = notes;
    }

    if (assignedTo) {
      updateData.assignedTo = assignedTo;
    }

    if (status === "contacted" && !updateData.contactedAt) {
      updateData.contactedAt = new Date();
    }

    const registration = await OrganizerRegistration.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate("assignedTo", "name email");

    if (!registration) {
      throw new Error("Registration not found");
    }

    await EmailService.sendStatusUpdateEmail(registration, status);

    return registration;
  };

  static assignRegistration = async (
    id: string,
    assignedToId: string
  ): Promise<IOrganizerRegistration> => {
    const registration = await OrganizerRegistration.findByIdAndUpdate(
      id,
      { assignedTo: assignedToId },
      { new: true }
    ).populate("assignedTo", "name email");

    if (!registration) {
      throw new Error("Registration not found");
    }

    return registration;
  };

  static addNotes = async (
    id: string,
    notes: string
  ): Promise<IOrganizerRegistration> => {
    const registration = await OrganizerRegistration.findByIdAndUpdate(
      id,
      { notes },
      { new: true }
    ).populate("assignedTo", "name email");

    if (!registration) {
      throw new Error("Registration not found");
    }

    return registration;
  };

  static getDashboardStats = async (): Promise<{
    total: number;
    pending: number;
    contacted: number;
    inProgress: number;
    completed: number;
    rejected: number;
    thisMonth: number;
    popularEventTypes: any[];
    popularCities: any[];
  }> => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      total,
      pending,
      contacted,
      inProgress,
      completed,
      rejected,
      thisMonth,
      popularEventTypes,
      popularCities,
    ] = await Promise.all([
      OrganizerRegistration.countDocuments(),
      OrganizerRegistration.countDocuments({ status: "pending" }),
      OrganizerRegistration.countDocuments({ status: "contacted" }),
      OrganizerRegistration.countDocuments({ status: "in_progress" }),
      OrganizerRegistration.countDocuments({ status: "completed" }),
      OrganizerRegistration.countDocuments({ status: "rejected" }),
      OrganizerRegistration.countDocuments({
        createdAt: { $gte: startOfMonth },
      }),
      OrganizerRegistration.aggregate([
        { $group: { _id: "$eventType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      OrganizerRegistration.aggregate([
        { $group: { _id: "$city", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    return {
      total,
      pending,
      contacted,
      inProgress,
      completed,
      rejected,
      thisMonth,
      popularEventTypes,
      popularCities,
    };
  };
}
