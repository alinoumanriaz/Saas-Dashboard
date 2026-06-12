import { APP_MODULES, COMPANY_MODULES, Permission, SubscriptionPlan, SubscriptionStatus } from "@/enums/common.enums";

export type Address = {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
};


export type ModuleName = COMPANY_MODULES | APP_MODULES;


export interface ModuleAccess {
  name: ModuleName;
  canAccess?: boolean;
  isActive?: boolean;
  description?: string;
  permissions: Permission[];
}

export interface Subscription {
    plan?: SubscriptionPlan;
    startDate?: Date;
    endDate?: Date;
    SubscriptionStatus?: SubscriptionStatus;
    paymentMethod?: string;
}