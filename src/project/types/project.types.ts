import { EventType } from "@prisma/client";

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

