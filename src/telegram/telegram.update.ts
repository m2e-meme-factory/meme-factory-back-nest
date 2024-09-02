import { UserRole } from '@prisma/client'
import { Update, Ctx, Start, InjectBot } from 'nestjs-telegraf'
import { PublicRoute } from 'src/auth/decorators/public-route.decorator'
import { UserService } from 'src/user/user.service'
import { Context, Telegraf } from 'telegraf'
import { InputFile } from 'telegraf/typings/core/types/typegram'
import { MyContext } from './telegram.context'
import { SEQUENCE_SCENE_ID } from './message-sequence.scene'

const ORIGIN_URL = process.env.HOST_URL

@Update()
export class TelegramUpdate {
	constructor(
		@InjectBot() private readonly bot: Telegraf<Context>,
		private readonly userService: UserService
	) {}

	@Start()
	@PublicRoute()
	async startCommand(@Ctx() ctx: MyContext) {
		const messageText = ctx.text || ''
		const params = messageText.split(' ')[1]?.split('_')
		const inviterRefCode = params?.[0]
		const metaTag = params?.[1]
		const user = await this.userService.findOrCreateUser(
			ctx.from.id,
			ctx.from.username,
			inviterRefCode,
			UserRole.creator,
			metaTag
		)

		await ctx.scene.enter(SEQUENCE_SCENE_ID)

		if (inviterRefCode && !user.isFounded) {
			const inviter = await this.userService.getUserByRefCode(inviterRefCode)
			if (inviter) {
				await this.bot.telegram.sendMessage(
					inviter.telegramId,
					`Ваш реферальный код был использован!`
				)
			}
		}
	}
	async sendFilesToUser(
		telegramId: string,
		files: string[],
		projectTitle: string = undefined
	): Promise<void> {
		const message = `Download attachments for project <b>${projectTitle || ''}</b>:\n`

		await this.bot.telegram.sendMessage(telegramId, message, {
			parse_mode: 'HTML'
		})

		const documents: InputFile[] = files.map(fileName => ({
			url: `${ORIGIN_URL}/files/download/${fileName}`,
			filename: fileName.substring(37)
		}))

		for (const document of documents) {
			await this.bot.telegram.sendDocument(telegramId, document, {
				caption: `Files for project: ${projectTitle || ''}`,
				parse_mode: 'HTML'
			})
		}
	}
}
