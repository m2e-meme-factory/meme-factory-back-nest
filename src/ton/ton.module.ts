import { Module } from '@nestjs/common';
import { TonService } from './ton.service';
import { TonController } from './ton.controller';
import { UserInfoService } from 'src/user-info/user-info.service';
import { AutoTaskService } from 'src/auto-task/auto-task.service';
import { AutoTaskModule } from 'src/auto-task/auto-task.module';

@Module({
  imports: [AutoTaskModule],
  controllers: [TonController],
  providers: [TonService, UserInfoService],
})
export class TonModule {}
