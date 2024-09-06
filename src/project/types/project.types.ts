import { EventType, Project } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export interface IEvent {
    id: number;
    progressProjectId: number
    userId: number;
    eventType: EventType;
    message?: string;
    createdAt: Date;
    details?: IDetails;
}

export interface IDetails {
    taskId?: number
    transactionId?: number
    amount?: number
}

export interface IProjectResponse {
    project: Project
    minPrice: Decimal
    maxPrice: Decimal
}