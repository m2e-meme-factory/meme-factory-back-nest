import { Module } from '@nestjs/common';
import { AutoTaskService } from './auto-task.service';
import { AutoTaskController } from './auto-task.controller';
import { TransactionService } from 'src/transaction/transaction.service';
import { UserService } from 'src/user/user.service';

@Module({
  controllers: [AutoTaskController],
  providers: [AutoTaskService, TransactionService, UserService],
})
export class AutoTaskModule {}
