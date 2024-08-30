import { UserRole } from '@prisma/client'
import { Update, Ctx, Start, InjectBot, Action } from 'nestjs-telegraf'
import { PublicRoute } from 'src/auth/decorators/public-route.decorator'
import { UserService } from 'src/user/user.service'
import { Context, Telegraf } from 'telegraf'
import { contentData, IContentSection } from './telegram.data'
import { InputFile } from 'telegraf/typings/core/types/typegram'

const ORIGIN_URL = process.env.HOST_URL

@Update()
export class TelegramUpdate {
	constructor(
		@InjectBot() private readonly bot: Telegraf<Context>,
		private readonly userService: UserService
	) {}

	private messageIndex = 0
	private currentTimer: NodeJS.Timeout | null = null

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
			this.messageIndex = 0
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

	@Action('next')
	async onNext(ctx: Context) {
		if (this.currentTimer) {
			clearTimeout(this.currentTimer)
			this.currentTimer = null
		}
		this.messageIndex++
		await this.sendNextContent(ctx, process.env.APP_URL)
	}

	private async sendContentSequence(ctx: Context, webAppUrl: string) {
		await this.sendNextContent(ctx, webAppUrl)
	}

	private async sendNextContent(ctx: Context, webAppUrl: string) {
		const contentSequence = [
			contentData.first,
			contentData.memeFactory,
			contentData.airdrop,
			contentData.sky,
			contentData.firstAdvertiser
		]

		if (this.messageIndex < contentSequence.length) {
			await this.sendContent(ctx, contentSequence[this.messageIndex], webAppUrl)
			this.messageIndex++

			this.currentTimer = setTimeout(async () => {
				await this.sendNextContent(ctx, webAppUrl)
			}, 20000)
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

		const replyMarkup = {
			inline_keyboard: [
				[
					{
						text: buttonText || 'Далее',
						callback_data: 'next'
					},
					{
						text: 'Открыть приложение',
						web_app: { url: webAppUrl + '/projects' }
					}
				]
			]
		}

		if (contentUrl) {
			if (contentUrl.endsWith('.mp4')) {
				await ctx.replyWithVideo(
					{ url: contentUrl },
					{
						caption,
						reply_markup: replyMarkup
					}
				)
			} else {
				await ctx.replyWithPhoto(
					{ url: contentUrl },
					{
						caption,
						reply_markup: replyMarkup
					}
				)
			}
		} else {
			await ctx.reply(caption, {
				reply_markup: replyMarkup
			})
		}
	}
}
