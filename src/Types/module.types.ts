// Types/module.types.ts
export enum ModuleStatus {
  UPCOMING = "UPCOMING",
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum ModuleCategory {
  CONFERENCE = "CONFERENCE",
  WORKSHOP = "WORKSHOP",
  SEMINAR = "SEMINAR",
  WEBINAR = "WEBINAR",
  MEETUP = "MEETUP",
  CONCERT = "CONCERT",
  EXHIBITION = "EXHIBITION",
}

export enum ModuleType {
  PHYSICAL = "PHYSICAL",
  VIRTUAL = "VIRTUAL",
  HYBRID = "HYBRID",
}

export interface Module {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location?: string;
  capacity?: number;
  status: ModuleStatus;
  category: ModuleCategory;
  eventType: ModuleType;
  attendees: Array<{
    id: string;
    username: string;
    email: string;
  }>;
  createdBy: {
    id: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}