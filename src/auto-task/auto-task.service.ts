import { Injectable } from '@nestjs/common';
import { CreateAutoTaskDto } from './dto/create-auto-task.dto';
import { UpdateAutoTaskDto } from './dto/update-auto-task.dto';

@Injectable()
export class AutoTaskService {
  create(createAutoTaskDto: CreateAutoTaskDto) {
    return 'This action adds a new autoTask';
  }

  findAll() {
    return `This action returns all autoTask`;
  }

  findOne(id: number) {
    return `This action returns a #${id} autoTask`;
  }

  update(id: number, updateAutoTaskDto: UpdateAutoTaskDto) {
    return `This action updates a #${id} autoTask`;
  }

  remove(id: number) {
    return `This action removes a #${id} autoTask`;
  }
}
