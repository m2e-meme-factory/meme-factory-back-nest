import { Module } from '@nestjs/common';
import { AutoTaskService } from './auto-task.service';
import { AutoTaskController } from './auto-task.controller';

@Module({
  controllers: [AutoTaskController],
  providers: [AutoTaskService],
})
export class AutoTaskModule {}
