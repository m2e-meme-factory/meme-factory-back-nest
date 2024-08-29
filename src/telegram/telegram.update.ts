// telegram.update.ts
import { UserRole } from '@prisma/client';
import { Update, Ctx, Start, InjectBot } from 'nestjs-telegraf'
import { PublicRoute } from 'src/auth/decorators/public-route.decorator'
import { UserService } from 'src/user/user.service'
import { Context, Telegraf } from 'telegraf'

const ORIGIN_URL = process.env.HOST_URL + "/uploads/projects";

@Update()
export class TelegramUpdate {
	constructor(
		@InjectBot() private readonly bot: Telegraf<Context>,
		private readonly userService: UserService
	) {}

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

		await ctx.reply(`Приветствуем, ${ctx.from.first_name}!`, {
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: 'Открыть приложение',
							web_app: { url: webAppUrl + '/projects' }
						}
					]
				]
			}
		})
		if (inviterRefCode && user.isFounded === false) {
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
		const message = files
			.map(
				fileName =>
					`- <a href="tg://resolve?domain=${ORIGIN_URL}/${fileName}">${fileName.substring(37)}</a>`
			)
			.join('\n')
		await this.bot.telegram.sendMessage(
			telegramId,
			`
Download attachments for project <b>${projectTitle || ''}</b> with this links:\n
${message}
`,
			{
				parse_mode: 'HTML',
				link_preview_options: {
					is_disabled: true
				}
			}
		)
	}
}
