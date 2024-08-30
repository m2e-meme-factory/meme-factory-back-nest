// telegram.update.ts
import { UserRole } from '@prisma/client'
import { Update, Ctx, Start, InjectBot } from 'nestjs-telegraf'
import { PublicRoute } from 'src/auth/decorators/public-route.decorator'
import { UserService } from 'src/user/user.service'
import { Context, Telegraf } from 'telegraf'
import { InputFile } from 'telegraf/typings/core/types/typegram'
import { contentData, IContentSection } from './telegram.data'

const ORIGIN_URL = process.env.HOST_URL

@Update()
export class TelegramUpdate {
	constructor(
		@InjectBot() private readonly bot: Telegraf<Context>,
		private readonly userService: UserService
	) {}

	@Start()
	@PublicRoute()
	@Start()
	@PublicRoute()
	async startCommand(@Ctx() ctx: Context) {
		const messageText = ctx.text
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
		const webAppUrl = process.env.APP_URL

		if (user.isFounded) {
			await this.sendContent(ctx, contentData.sky, webAppUrl)
		} else {
			await this.sendContentSequence(ctx, webAppUrl)
		}

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
			parse_mode: 'HTML',
			link_preview_options: {
				is_disabled: true
			}
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

	private async sendContent(
		ctx: Context,
		content: IContentSection,
		webAppUrl: string
	) {
		const { caption, contentUrl, buttonText } = content

		await ctx.replyWithPhoto(
			{ url: contentUrl || '' },
			{
				caption,
				reply_markup: {
					inline_keyboard: [
						[
							{
								text: buttonText || 'Далее',
								web_app: buttonText
									? { url: webAppUrl + '/projects' }
									: undefined,
								callback_data: 'next'
							}
						]
					]
				}
			}
		)
	}

	private async sendContentSequence(ctx: Context, webAppUrl: string) {
		const contentSequence = [
			contentData.first,
			contentData.memeFactory,
			contentData.airdrop,
			contentData.sky,
			contentData.firstAdvertiser
		]

		for (const content of contentSequence) {
			await this.sendContent(ctx, content, webAppUrl)
			await new Promise(resolve => setTimeout(resolve, 20000))
		}
	}
}
