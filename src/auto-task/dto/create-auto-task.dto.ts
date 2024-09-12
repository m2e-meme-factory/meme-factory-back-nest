import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, IsUrl } from 'class-validator';
import { Decimal } from '@prisma/client/runtime/library';

export class GetAutoTaskDto {
  @ApiProperty({
    description: 'ID of the auto task',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({
    description: 'Title of the automatic task',
    example: 'Complete the tutorial',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Description of the automatic task',
    example: 'Complete the tutorial to earn a reward.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Reward for completing the task',
    example: '100.00',
  })
  @IsOptional()
  reward?: Decimal;

  @ApiProperty({
    description: 'URL associated with the task, if any',
    example: 'https://example.com/task',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiProperty({
    description: 'Creation date of the task',
    example: '2024-01-01T00:00:00.000Z',
    readOnly: true,
  })
  @IsOptional()
  createdAt?: Date;


  @ApiProperty({ example: false })
  @IsOptional()
  @IsBoolean()
  isConfirmed?: boolean;
}
