import { Types } from "mongoose";
import Contributor from "../models/Contributor.model";
import Event from "../models/Event.model";
import { IContributor } from "../interfaces/contributor.interface";
import { generateMixedRandomCode } from "../utils/helper-function";
import { EmailService } from "./email.service";

export class ContributorService {
  static addContributor = async (
    eventId: string,
    email: string,
    organizationId?: string
  ): Promise<IContributor> => {
    const event = await Event.findById(eventId).populate("organization");
    if (!event) {
      throw new Error("Event not found");
    }

    const orgId = organizationId || event.organization;
    const verificationToken = generateMixedRandomCode();

    let contributor = await Contributor.findOne({ email });

    if (contributor) {
      const existingEvent = contributor.events.find(
        (e) => e.eventId.toString() === eventId && !e.isDeleted
      );

      if (existingEvent) {
        throw new Error("Contributor already exists for this event");
      }

      contributor.events.push({
        eventId: new Types.ObjectId(eventId),
        organizationId: new Types.ObjectId(orgId),
        status: "pending",
        verificationToken,
        addedAt: new Date(),
        isDeleted: false,
      });
    } else {
      contributor = new Contributor({
        email,
        events: [
          {
            eventId: new Types.ObjectId(eventId),
            organizationId: new Types.ObjectId(orgId),
            status: "pending",
            verificationToken,
            addedAt: new Date(),
            isDeleted: false,
          },
        ],
      });
    }

    await contributor.save();
    await EmailService.sendContributorVerificationEmail(
      email,
      event,
      verificationToken
    );

    return contributor;
  };

  static verifyContributor = async (
    email: string,
    token: string
  ): Promise<IContributor> => {
    const contributor = await Contributor.findOne({ email });

    if (!contributor) {
      throw new Error("Contributor not found");
    }

    const eventIndex = contributor.events.findIndex(
      (e) => e.verificationToken === token && !e.isDeleted
    );

    if (eventIndex === -1) {
      throw new Error("Invalid verification token");
    }

    const contributorEvent = contributor.events[eventIndex];

    if (contributorEvent.status === "active") {
      throw new Error("Contributor is already verified for this event");
    }

    contributor.events[eventIndex].status = "active";

    await contributor.save();

    return contributor;
  };

  static loginContributor = async (
    email: string,
    eventPassword: string
  ): Promise<{
    contributor: IContributor;
    eventAccess: any;
  }> => {
    const contributor = await Contributor.findOne({ email });

    if (!contributor) {
      throw new Error("Contributor not found");
    }

    let matchedEvent = null;
    let matchedEventAccess = null;

    for (const eventAccess of contributor.events) {
      if (eventAccess.isDeleted || eventAccess.status !== "active") continue;

      const event = await Event.findById(eventAccess.eventId).select(
        "+eventPassword"
      );
      if (event && event.eventPassword === eventPassword) {
        matchedEvent = event;
        matchedEventAccess = eventAccess;
        break;
      }
    }

    if (!matchedEvent) {
      throw new Error("Invalid event password or no access to this event");
    }

    return {
      contributor,
      // event: matchedEvent,
      eventAccess: matchedEventAccess,
    };
  };

  static getEventContributors = async (eventId: string): Promise<any[]> => {
    const contributors = await Contributor.find({
      "events.eventId": eventId,
      "events.isDeleted": false,
    });

    return contributors.map((contributor) => {
      const eventAccess = contributor.events.find(
        (e) => e.eventId.toString() === eventId && !e.isDeleted
      );

      return {
        _id: contributor._id,
        email: contributor.email,
        status: eventAccess?.status || "pending",
        addedAt: eventAccess?.addedAt || contributor.createdAt,
        verificationToken: eventAccess?.verificationToken,
      };
    });
  };

  static updateContributorStatus = async (
    contributorId: string,
    eventId: string,
    status: "active" | "inactive"
  ): Promise<IContributor> => {
    const contributor = await Contributor.findById(contributorId);
    if (!contributor) {
      throw new Error("Contributor not found");
    }

    const eventIndex = contributor.events.findIndex(
      (e) => e.eventId.toString() === eventId && !e.isDeleted
    );

    if (eventIndex === -1) {
      throw new Error("Contributor not found for this event");
    }

    contributor.events[eventIndex].status = status;
    await contributor.save();

    return contributor;
  };

  static removeContributorFromEvent = async (
    contributorId: string,
    eventId: string
  ): Promise<void> => {
    const contributor = await Contributor.findById(contributorId);
    if (!contributor) {
      throw new Error("Contributor not found");
    }

    const eventIndex = contributor.events.findIndex(
      (e) => e.eventId.toString() === eventId && !e.isDeleted
    );

    if (eventIndex === -1) {
      throw new Error("Contributor not found for this event");
    }

    contributor.events[eventIndex].isDeleted = true;
    await contributor.save();
  };

  static resendVerificationEmail = async (
    contributorId: string,
    eventId: string
  ): Promise<void> => {
    const contributor = await Contributor.findById(contributorId);
    if (!contributor) {
      throw new Error("Contributor not found");
    }

    const eventIndex = contributor.events.findIndex(
      (e) => e.eventId.toString() === eventId && !e.isDeleted
    );

    if (eventIndex === -1) {
      throw new Error("Contributor not found for this event");
    }

    const contributorEvent = contributor.events[eventIndex];

    if (contributorEvent.status === "active") {
      throw new Error("Contributor is already verified for this event");
    }

    const newToken = generateMixedRandomCode();
    contributor.events[eventIndex].verificationToken = newToken;
    await contributor.save();

    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    await EmailService.sendContributorVerificationEmail(
      contributor.email,
      event,
      newToken
    );
  };

  static getContributorEvents = async (email: string): Promise<any[]> => {
    const contributor = await Contributor.findOne({ email })
      .populate({
        path: "events.eventId",
        select: "name description startDate endDate venue",
      })
      .populate({
        path: "events.organizationId",
        select: "name",
      });

    if (!contributor) {
      return [];
    }

    return contributor.events
      .filter((e) => !e.isDeleted)
      .map((e) => ({
        event: e.eventId,
        organization: e.organizationId,
        status: e.status,
        addedAt: e.addedAt,
      }));
  };
}
