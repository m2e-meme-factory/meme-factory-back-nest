import { Module } from '@nestjs/common';
import { ProjectService } from './services/project.service';
import { ProjectController } from './controllers/project.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TelegramUpdate } from 'src/telegram/telegram.update';
import { UserService } from 'src/user/user.service';
import { EventService } from 'src/event/event.service';
import { ProjectProgressService } from './services/project-progress.service';
import { TaskProgressService } from './services/task-progress.service';
import { TaskController } from './controllers/task.controller';
import { ProjectProgressController } from './controllers/project-progress.controller';
import { TransactionService } from 'src/transaction/transaction.service';

@Module({
  imports: [PrismaModule],
  providers: [ProjectService, TelegramUpdate, UserService, EventService, ProjectProgressService, TaskProgressService, TransactionService],
  controllers: [ProjectController, TaskController, ProjectProgressController]
})
export class ProjectModule {}
