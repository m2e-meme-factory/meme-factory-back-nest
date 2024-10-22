import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { ProjectModule } from './project/project.module';
import { AuthModule } from './auth/auth.module';
import { FileService } from './file/file.service';
import { FileController } from './file/file.controller';
import { FileModule } from './file/file.module';
import { TelegramModule } from './telegram/telegram.module';
import { TransactionModule } from './transaction/transaction.module';
import { EventModule } from './event/event.module';
import { TonModule } from './ton/ton.module';
import { UserInfoModule } from './user-info/user-info.module';
import { PrismaService } from './prisma/prisma.service';
import { AutoTaskModule } from './auto-task/auto-task.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [PrismaModule, UserModule, ProjectModule, AuthModule, FileModule, TelegramModule, TransactionModule, EventModule, TonModule, UserInfoModule, AutoTaskModule, NotificationModule],
  controllers: [FileController],
  providers: [FileService, PrismaService],
})
export class AppModule {}
