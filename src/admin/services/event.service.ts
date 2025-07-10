import moment from "moment";
import { getAll } from "../../utils/helper";
import EventModel from "../../models/Event.model";
import mongoose, { mongo } from "mongoose";

class adminEventService {
  getEventList = async () => {
    const events = await getAll(EventModel);
    const now = moment();

    const updatedEvents = events?.map((event) => {
      let status = "pending";

      if (event.isPublished) {
        const startDate = moment(event.startDate);
        const endDate = moment(event.endDate);

        if (startDate.isAfter(now)) {
          status = "upcoming";
        } else if (
          startDate.isSameOrBefore(now) &&
          endDate.isSameOrAfter(now)
        ) {
          status = "live";
        } else if (endDate.isBefore(now)) {
          status = "closed";
        }
      }

      return {
        ...event.toObject(),
        status,
      };
    });

    return updatedEvents;
  };

  removeArtistAndSponsorById = async (
    eventId: mongoose.Types.ObjectId,
    profile: mongoose.Types.ObjectId,
    type: "artist" | "sponsor"
  ) => {
    const update =
      type === "artist"
        ? { $pull: { artists: { _id: profile } } }
        : { $pull: { sponsors: { _id: profile } } };
    const event = await EventModel.findOneAndUpdate({ _id: eventId }, update, {
      new: true,
    });

    if (!event) {
      throw new Error("Event not found or no matching artist/sponsor");
    }

    return event;
  };
}

export const AdminEventService = new adminEventService();
