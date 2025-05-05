import mongoose from "mongoose";
import { IOrganization } from "../interfaces/organization.interface";
import EventModel from "../models/Event.model";
import OrganizationModel from "../models/Organization.model";
import { createOne, updateOne } from "../utils/helper";

class organizationService {
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

  getEventBanner = async () => {
    return await EventModel.find({}).select("bannerImage slug").lean().limit(5);
  };
  getEventPosters = async () => {
    return await EventModel.find({})
      .select("posterImage slug name ")
      .lean()
      .limit(5);
  };
}

export const OrganizationService = new organizationService();
