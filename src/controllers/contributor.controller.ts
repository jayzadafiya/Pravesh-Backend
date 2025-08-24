import { Request, Response } from "express";
import { ContributorService } from "../services/contributor.service";
import { BadRequestException, NotFoundException } from "../utils/exceptions";

export const addContributor = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { eventId, email, organizationId } = req.body;

    if (!eventId || !email) {
      throw new BadRequestException("Event ID and email are required");
    }

    const contributor = await ContributorService.addContributor(
      eventId,
      email,
      organizationId
    );

    res.status(201).json({
      success: true,
      message: "Contributor added successfully",
      data: contributor,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyContributor = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, token } = req.query;

    if (!email || !token) {
      throw new BadRequestException("Email and token are required");
    }

    const contributor = await ContributorService.verifyContributor(
      email as string,
      token as string
    );

    // For web browser requests (when coming from email links), redirect to frontend
    const userAgent = req.headers["user-agent"] || "";
    const isWebBrowser =
      !userAgent.includes("curl") &&
      !userAgent.includes("wget") &&
      !userAgent.includes("Postman");

    if (isWebBrowser && req.headers.accept?.includes("text/html")) {
      // Redirect to admin frontend verification success page
      return res.redirect(
        `${
          process.env.ADMIN_FRONTEND_URL
        }/contributor/verify?success=true&email=${encodeURIComponent(
          email as string
        )}`
      );
    }

    // For API requests, return JSON response
    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: contributor,
    });
  } catch (error: any) {
    // For web browser requests, redirect to error page
    const userAgent = req.headers["user-agent"] || "";
    const isWebBrowser =
      !userAgent.includes("curl") &&
      !userAgent.includes("wget") &&
      !userAgent.includes("Postman");

    if (isWebBrowser && req.headers.accept?.includes("text/html")) {
      return res.redirect(
        `${
          process.env.ADMIN_FRONTEND_URL
        }/contributor/verify?error=${encodeURIComponent(error.message)}`
      );
    }

    // For API requests, return JSON error response
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const loginContributor = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, eventPassword } = req.body;

    if (!email || !eventPassword) {
      throw new BadRequestException("Email and event password are required");
    }

    const result = await ContributorService.loginContributor(
      email,
      eventPassword
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        contributor: result.contributor,
        eventAccess: result.eventAccess,
      },
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

export const getEventContributors = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      throw new BadRequestException("Event ID is required");
    }

    const contributors = await ContributorService.getEventContributors(eventId);

    res.status(200).json({
      success: true,
      data: contributors,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateContributorStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { contributorId } = req.params;
    const { status, eventId } = req.body;

    if (!contributorId || !status || !eventId) {
      throw new BadRequestException(
        "Contributor ID, status, and event ID are required"
      );
    }

    if (!["active", "inactive"].includes(status)) {
      throw new BadRequestException("Status must be 'active' or 'inactive'");
    }

    const contributor = await ContributorService.updateContributorStatus(
      contributorId,
      eventId,
      status
    );

    res.status(200).json({
      success: true,
      message: "Contributor status updated successfully",
      data: contributor,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const removeContributorFromEvent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { contributorId } = req.params;
    const { eventId } = req.body;

    if (!contributorId || !eventId) {
      throw new BadRequestException("Contributor ID and event ID are required");
    }

    await ContributorService.removeContributorFromEvent(contributorId, eventId);

    res.status(200).json({
      success: true,
      message: "Contributor removed from event successfully",
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const resendVerificationEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { contributorId } = req.params;
    const { eventId } = req.body;

    if (!contributorId || !eventId) {
      throw new BadRequestException("Contributor ID and event ID are required");
    }

    await ContributorService.resendVerificationEmail(contributorId, eventId);

    res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getContributorEvents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.params;

    if (!email) {
      throw new BadRequestException("Email is required");
    }

    const events = await ContributorService.getContributorEvents(email);

    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
