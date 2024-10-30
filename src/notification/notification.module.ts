import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationQueue } from './notification.queue';
import { PrismaModule } from '../prisma/prisma.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    TelegramModule,
  ],
  providers: [NotificationService, NotificationQueue],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
