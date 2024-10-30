import { IsString, IsOptional, IsDate } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  userId: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsDate()
  scheduledFor?: Date;
}

