import { Request, Response } from "express";
import {
  BadRequestException,
  ForbiddenException,
} from "../../utils/exceptions";
import OrganizationModel from "../../models/Organization.model";
import { EmailService } from "../../services/email.service";
import { AdminAuthService } from "../services/auth.service";
import { AdminAuthRequest } from "../../interfaces/admin-auth-request.interface";

class adminAuthController {
  sendSetupEmail = async (req: Request, res: Response) => {
    try {
      const { email, name } = req.body;
      if (!email) {
        throw new BadRequestException(
          "Email and organization name are required"
        );
      }

      let organization = await OrganizationModel.findOne({ email });
      if (!organization) {
        organization = new OrganizationModel({
          name,
          email,
          role: "organization",
          emailVerified: false,
          active: true,
        });
        await organization.save();
      }

      const setupToken = AdminAuthService.signToken(organization._id, "1h");

      await EmailService.sendOrganizationSetPasswordEmail(email, setupToken);

      res.status(200).json({ message: "Setup email sent successfully" });
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  setPassword = async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        throw new BadRequestException("Token and password are required");
      }

      const decoded: any = AdminAuthService.verifyToken(token);
      if (!decoded) {
        throw new BadRequestException("Invalid or expired token");
      }

      const organization = await OrganizationModel.findById(decoded.id);
      if (!organization) {
        throw new BadRequestException("Organization not found");
      }

      organization.password = password;
      organization.emailVerified = true;
      await organization.save();

      res.status(200).json({ message: "Password set successfully" });
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  loginOrganization = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new BadRequestException("Email and password are required");
      }

      const organization: any = await OrganizationModel.findOne({ email })
        .select("+password")
        .lean();

      if (!organization) {
        throw new BadRequestException("Invalid email or password");
      }

      if (!organization.active) {
        throw new ForbiddenException("Account is deactivated");
      }

      if (!organization.emailVerified) {
        throw new ForbiddenException(
          "Email not verified. Please complete the setup process."
        );
      }

      const isPasswordValid = await OrganizationModel.findById(organization._id)
        .select("+password")
        .then((org) => org?.comparePassword(password));

      if (!isPasswordValid) {
        throw new BadRequestException("Invalid email or password");
      }

      delete organization.password;

      const token = AdminAuthService.signToken(organization._id);

      res.status(200).json({
        status: "success",
        token,
        user: {
          id: organization._id,
          email: organization.email,
          name: organization.name,
          role: organization.role,
          organizationId: organization._id,
        },
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };

  getMe = async (req: Request, res: Response) => {
    try {
      const organization = (req as AdminAuthRequest).organization;

      res.status(200).json({
        status: "success",
        user: {
          id: organization._id,
          email: organization.email,
          name: organization.name,
          role: organization.role,
          organizationId: organization._id,
          description: organization.description,
          logoUrl: organization.logoUrl,
          emailVerified: organization.emailVerified,
          active: organization.active,
        },
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).send({ message: error.message });
    }
  };
}

export const AdminAuthController = new adminAuthController();
