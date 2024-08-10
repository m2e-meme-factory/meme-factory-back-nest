import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TelegramUpdate } from 'src/telegram/telegram.update';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [PrismaModule],
  providers: [ProjectService, TelegramUpdate, UserService],
  controllers: [ProjectController]
})
export class ProjectModule {}
