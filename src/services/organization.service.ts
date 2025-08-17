import mongoose from "mongoose";
import { IOrganization } from "../interfaces/organization.interface";
import EventModel from "../models/Event.model";
import OrganizationModel from "../models/Organization.model";
import { createOne, getOne, updateOne } from "../utils/helper";
import { IEvent } from "../interfaces/event.interface";

class organizationService {
  getEventBanner = async () => {
    const currentDate = new Date();
    return await EventModel.find({
      endDate: { $gte: currentDate },
    })
      .select("bannerImage name startDate location duration slug")
      .lean()
      .limit(5);
  };

  getEventPosters = async (isPublished = false) => {
    const currentDate = new Date();
    return await EventModel.find({
      isPublished,
      endDate: { $gte: currentDate },
    })
      .select("posterImage slug name description ")
      .lean();
  };

  getEvent = async (slug: string): Promise<IEvent | null> => {
    const currentDate = new Date();
    return await EventModel.findOne({
      slug,
      endDate: { $gte: currentDate }, // Only return event if it hasn't ended yet
    });
  };

  getEventById = async (eventId: string): Promise<IEvent | null> => {
    const currentDate = new Date();
    return await EventModel.findOne({
      _id: new mongoose.Types.ObjectId(eventId),
      endDate: { $gte: currentDate }, // Only return event if it hasn't ended yet
    });
  };

  // Method to get event by ID without date restriction (for admin purposes)
  getEventByIdAdmin = async (eventId: string): Promise<IEvent | null> => {
    return await getOne(EventModel, new mongoose.Types.ObjectId(eventId));
  };

  // Method to get all active events
  getActiveEvents = async () => {
    const currentDate = new Date();
    return await EventModel.find({
      endDate: { $gte: currentDate },
      isPublished: true,
    })
      .select("name slug startDate endDate location posterImage bannerImage")
      .lean()
      .sort({ startDate: 1 }); // Sort by start date
  };

  createOrganization = async (data: IOrganization) => {
    return await createOne(OrganizationModel, data);
  };
  createEvent = async (data: IOrganization) => {
    return await createOne(EventModel, data);
  };

  updateEvent = async (eventId: string, updateData: any) => {
    return await updateOne(
      EventModel as any,
      new mongoose.Types.ObjectId(eventId),
      updateData
    );
  };

  upsertEntity = async (
    eventId: string,
    entity: { name: string; profileImage: string; order: number },
    type: "artists" | "sponsors"
  ) => {
    // Use admin method for entity updates (admins can update expired events)
    const event = await this.getEventByIdAdmin(eventId);
    if (!event) throw { statusCode: 404, message: "Event not found" };

    if (!event[type]) {
      event[type] = [];
    }

    const index = event[type].findIndex(
      (e: { name: string }) =>
        e.name.toLowerCase() === entity.name.toLowerCase()
    );

    if (index !== -1) {
      event[type][index].profileImage = entity.profileImage;
      event[type][index].order = entity.order;
    } else {
      event[type].push(entity);
    }

    await event.save();
    return event[type];
  };
}

export const OrganizationService = new organizationService();
