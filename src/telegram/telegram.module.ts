// telegram.module.ts
import { Module } from '@nestjs/common'
import { TelegrafModule } from 'nestjs-telegraf'
import { TelegramUpdate } from './telegram.update'
import { UserService } from 'src/user/user.service'
import { Agent } from 'https'

@Module({
	imports: [
		TelegrafModule.forRoot({
			token: process.env.BOT_TOKEN,
			options: {
				telegram: {
					agent: new Agent({
						keepAlive: false
					})
				}
			} //env
		})
	],
	providers: [TelegramUpdate, UserService]
})
export class TelegramModule {}
