import { Permission, SubscriptionPlan, SubscriptionStatus } from "@/enums/common.enums";

export type Address = {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
};




export interface ModuleAccess {
    moduleId: any;
    isActive?: boolean;
    permissions: Permission[];
}

export interface Subscription {
    plan?: SubscriptionPlan;
    startDate?: Date;
    endDate?: Date;
    SubscriptionStatus?: SubscriptionStatus;
    paymentMethod?: string;
}