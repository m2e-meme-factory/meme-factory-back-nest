// telegram.module.ts
import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramUpdate } from './telegram.update';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: process.env.BOT_TOKEN, //env
    }),
  ],
  providers: [TelegramUpdate, UserService],
})
export class TelegramModule {}
