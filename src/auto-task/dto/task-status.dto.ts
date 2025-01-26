import { ApiProperty } from '@nestjs/swagger';
import { AutoTaskType } from '@prisma/client';

export class TaskStatusResponse {
  @ApiProperty()
  taskId: number;

  @ApiProperty({ enum: AutoTaskType })
  taskType: AutoTaskType;

  @ApiProperty()
  isCompleted: boolean;

  @ApiProperty({ nullable: true })
  lastCompletedAt: Date | null;

  @ApiProperty()
  canBeClaimed: boolean;
} 