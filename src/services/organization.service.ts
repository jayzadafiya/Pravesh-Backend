import mongoose from "mongoose";
import { IOrganization } from "../interfaces/organization.interface";
import EventModel from "../models/Event.model";
import OrganizationModel from "../models/Organization.model";
import { createOne, getOne, updateOne } from "../utils/helper";
import { IEvent } from "../interfaces/event.interface";

class organizationService {
  getEventBanner = async () => {
    return await EventModel.find({})
      .select("bannerImage name startDate location duration slug")
      .lean()
      .limit(5);
  };

  getEventPosters = async (isPublished = false) => {
    return await EventModel.find({ isPublished })
      .select("posterImage slug name description ")
      .lean();
  };

  getEvent = async (slug: string): Promise<IEvent | null> => {
    return await EventModel.findOne({ slug });
  };

  getEventById = async (eventId: string): Promise<IEvent | null> => {
    return await getOne(EventModel, new mongoose.Types.ObjectId(eventId));
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
    const event = await this.getEventById(eventId);
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
