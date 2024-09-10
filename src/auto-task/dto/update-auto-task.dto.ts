import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateAutoTaskDto } from './create-auto-task.dto';
import { IsBoolean } from 'class-validator';

export class UpdateAutoTaskDto extends PartialType(CreateAutoTaskDto) {

    @ApiProperty({example: false})
    @IsBoolean()
    isConfirmed: boolean
    

}
