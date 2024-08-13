import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TelegramUpdate } from 'src/telegram/telegram.update';
import { UserService } from 'src/user/user.service';
import { EventService } from 'src/event/event.service';

@Module({
  imports: [PrismaModule],
  providers: [ProjectService, TelegramUpdate, UserService, EventService],
  controllers: [ProjectController]
})
export class ProjectModule {}
