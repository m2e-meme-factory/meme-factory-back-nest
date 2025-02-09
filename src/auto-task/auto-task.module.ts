import { Module } from '@nestjs/common';
import { AutoTaskService } from './auto-task.service';
import { AutoTaskController } from './auto-task.controller';
import { TransactionService } from 'src/transaction/transaction.service';
import { UserService } from 'src/user/user.service';
import { AutoTaskDefaultController } from './auto-task-default.controller';

@Module({
  controllers: [AutoTaskController, AutoTaskDefaultController],
  providers: [AutoTaskService, TransactionService, UserService],
  exports: [AutoTaskService]
})
export class AutoTaskModule {}
