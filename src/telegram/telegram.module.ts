// telegram.module.ts
import { Module } from '@nestjs/common'
import { TelegrafModule } from 'nestjs-telegraf'
import { TelegramUpdate } from './telegram.update'
import { MessageSequenceScene } from './message-sequence.scene'
import { UserService } from 'src/user/user.service'
import { Agent } from 'https'

@Module({
	imports: [
		TelegrafModule.forRoot({
			token: process.env.BOT_TOKEN,
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
		{
			provide: 'TELEGRAM_SCENES',
			useFactory: (messageSequenceScene: MessageSequenceScene) => {
				return [messageSequenceScene.scene]
			},
			inject: [MessageSequenceScene]
		}
	]
})
export class TelegramModule {}
