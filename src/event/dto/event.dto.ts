import { EventType, UserRole } from "@prisma/client";
import { IsEnum, IsInt, IsOptional, IsString } from "class-validator";

export class CreateEventDto {
    @IsInt()
    projectId: number;
  
    @IsInt()
    userId: number;
  
    @IsEnum(UserRole)
    role: UserRole;
  
    @IsEnum(EventType)
    eventType: EventType;
  
    @IsString()
    @IsOptional()
    description?: string;
  
    @IsOptional()
    details?: Record<string, any>;
  }