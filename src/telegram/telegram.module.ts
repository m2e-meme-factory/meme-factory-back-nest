import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramUpdate } from './telegram.update';
import { MessageSequenceScene } from './message-sequence.scene';
import { UserService } from 'src/user/user.service';
import { Agent } from 'https';
import { session } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';
import { TransactionService } from 'src/transaction/transaction.service';

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: process.env.BOT_TOKEN,
      middlewares: [session()],
      options: {
        telegram: {
          agent: new Agent({ keepAlive: false })
        }
      }
    })
  ],
  providers: [
    TelegramUpdate,
    MessageSequenceScene,
    UserService,
    PrismaService,
    TransactionService,
    {
      provide: 'TELEGRAM_SCENES',
      useFactory: (messageSequenceScene: MessageSequenceScene) => {
        return [messageSequenceScene];
      },
      inject: [MessageSequenceScene],
    },
  ],
})
export class TelegramModule {}
