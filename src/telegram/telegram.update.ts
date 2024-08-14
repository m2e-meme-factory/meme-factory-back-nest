// telegram.update.ts
import { Update, Ctx, Start, InjectBot } from 'nestjs-telegraf'
import { PublicRoute } from 'src/auth/decorators/public-route.decorator'
import { UserService } from 'src/user/user.service'
import { Context, Markup, Telegraf } from 'telegraf'

const ORIGIN_URL = "https://api.digital-boost.site/uploads/projects";

@Update()
export class TelegramUpdate {
	constructor(
		@InjectBot() private readonly bot: Telegraf<Context>,
		private readonly userService: UserService
	) { }

	@Start()
	@PublicRoute()
	async startCommand(@Ctx() ctx: Context) {
		const messageText = ctx.text
		const inviterRefCode = messageText.split(' ')[1]
		await this.userService.findOrCreateUser(
			ctx.from.id,
			ctx.from.username,
			inviterRefCode
		)
		const webAppUrl = process.env.APP_URL

		await ctx.reply(`Приветствуем, ${ctx.from.first_name}!`, {
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: 'Открыть приложение',
							web_app: { url: webAppUrl + "/projects" }
						}
					]
				]
			}
		})

		if (inviterRefCode) {
			const inviter = await this.userService.getUserByRefCode(inviterRefCode)

			if (inviter) {
				await this.bot.telegram.sendMessage(
					inviter.telegramId,
					`Ваш реферальный код был использован!`
				)
			}
		}
	}
	async sendFilesToUser(telegramId: string, files: string[], projectTitle: string = undefined): Promise<void> {
		const message = files.map(
			fileName => `- <a href="${ORIGIN_URL}/${fileName}">${fileName.substring(37)}</a>`
		).join("\n")
		console.log(message);
		await this.bot.telegram.sendMessage(telegramId, `
Download attachments for project <b>${projectTitle || ""}</b> with this links:\n
${message}
`, { parse_mode: "HTML",
	link_preview_options: {
		is_disabled: true
	}
 })
	}
}
