import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TelegramUpdate } from 'src/telegram/telegram.update';
import { UserService } from 'src/user/user.service';
import { EventService } from 'src/event/event.service';
import { ProjectProgressService } from './project-progress.service';
import { TaskProgressService } from './task-progress.service';

@Module({
  imports: [PrismaModule],
  providers: [ProjectService, TelegramUpdate, UserService, EventService, ProjectProgressService, TaskProgressService],
  controllers: [ProjectController]
})
export class ProjectModule {}
