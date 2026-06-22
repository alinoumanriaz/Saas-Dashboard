import { Address, ModuleAccess, Subscription } from "./common.types";
import { PlatformRole } from "@/enums/common.enums";


export interface Member {
  id?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  phone?: string;
  status?: string;
  isVerified?: boolean;
  role?: PlatformRole;
  permissions?: string[];
  modules?: ModuleAccess[];
  subscription?: Subscription;
  avatar?: string;
  address?: Address;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
};