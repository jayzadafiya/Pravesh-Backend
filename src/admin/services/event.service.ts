import moment from "moment";
import { getAll } from "../../utils/helper";
import EventModel from "../../models/Event.model";

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
}

export const AdminEventService = new adminEventService();
