import { Request } from "express";
import { IUser } from "./user.interface";
import { IOrganization } from "./organization.interface";

export interface AuthRequest extends Request {
  user: IUser;
  organization?: IOrganization;
}
