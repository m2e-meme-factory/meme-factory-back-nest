import { PartialType } from '@nestjs/swagger';
import { CreateAutoTaskDto } from './create-auto-task.dto';

export class UpdateAutoTaskDto extends PartialType(CreateAutoTaskDto) {}
