import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AutoTaskService } from './auto-task.service';
import { CreateAutoTaskDto } from './dto/create-auto-task.dto';
import { UpdateAutoTaskDto } from './dto/update-auto-task.dto';

@Controller('auto-task')
export class AutoTaskController {
  constructor(private readonly autoTaskService: AutoTaskService) {}

  @Post()
  create(@Body() createAutoTaskDto: CreateAutoTaskDto) {
    return this.autoTaskService.create(createAutoTaskDto);
  }

  @Get()
  findAll() {
    return this.autoTaskService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.autoTaskService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAutoTaskDto: UpdateAutoTaskDto) {
    return this.autoTaskService.update(+id, updateAutoTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.autoTaskService.remove(+id);
  }
}
