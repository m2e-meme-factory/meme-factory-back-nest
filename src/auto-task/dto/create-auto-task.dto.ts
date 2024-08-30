import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

export class CreateAutoTaskDto {

  @ApiProperty({
    description: 'Title of the automatic task',
    example: 'Complete the tutorial',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Description of the automatic task',
    example: 'Complete the tutorial to earn a reward.',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Reward for completing the task',
    example: '100 points',
  })
  @IsNotEmpty()
  @IsString()
  reward: Decimal;

  @ApiProperty({
    description: 'URL associated with the task, if any',
    example: 'https://example.com/task',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiProperty({
    description: 'ID of the user associated with the task',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  userId: number;
  @ApiProperty({
    description: 'ID of the task associated with the apply',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  taskId: number;

  @ApiProperty({
    description: 'Creation date of the task',
    example: '2024-01-01T00:00:00.000Z',
    readOnly: true,
  })
  @IsOptional()
  createdAt?: Date;
}
