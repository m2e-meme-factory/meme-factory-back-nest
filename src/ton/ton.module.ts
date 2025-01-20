import { Module } from '@nestjs/common';
import { TonService } from './ton.service';
import { TonController } from './ton.controller';
import { UserInfoService } from 'src/user-info/user-info.service';
import { TransactionService } from 'src/transaction/transaction.service';

@Module({
  controllers: [TonController],
  providers: [TonService, UserInfoService, TransactionService],
})
export class TonModule {}
