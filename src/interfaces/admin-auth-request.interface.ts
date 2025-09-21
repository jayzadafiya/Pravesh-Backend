import { Request } from "express";
import { IOrganization } from "./organization.interface";

export interface AdminAuthRequest extends Request {
  organization: IOrganization;
}
