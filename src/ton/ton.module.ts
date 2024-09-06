import { Module } from '@nestjs/common';
import { TonService } from './ton.service';
import { TonController } from './ton.controller';
import { UserInfoService } from 'src/user-info/user-info.service';

@Module({
  controllers: [TonController],
  providers: [TonService, UserInfoService],
})
export class TonModule {}
