// telegram.update.ts
import { Update, Ctx, Start, InjectBot } from 'nestjs-telegraf'
import { PublicRoute } from 'src/auth/decorators/public-route.decorator'
import { UserService } from 'src/user/user.service'
import { Context, Telegraf } from 'telegraf'

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
		const inviterRefCode = messageText.split(' ')[1]
    await this.userService.findOrCreateUser(ctx.from.id, ctx.from.username, inviterRefCode)
	}
}
