import {
	Injectable,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { TransactionType } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { parse, validate } from '@telegram-apps/init-data-node'
import { InjectBot } from 'nestjs-telegraf'
import { PrismaService } from 'src/prisma/prisma.service'
import { TransactionService } from 'src/transaction/transaction.service'
import { UserService } from 'src/user/user.service'
import { Context, Markup, Telegraf } from 'telegraf'

@Injectable()
export class AuthService {
	constructor(
		@InjectBot() private readonly bot: Telegraf<Context>,

		private readonly userService: UserService,
		private readonly jwtService: JwtService,
		private readonly transactionService: TransactionService,
		private readonly prisma: PrismaService
	) {}
	async login(initData: string) {
		const botToken = process.env.BOT_TOKEN

		try {
			validate(initData, botToken, {
				expiresIn: 60 * 60 * 24
			})

			const parsedData = parse(initData)
			const { user, isFounded } = await this.userService.findOrCreateUser(
				parsedData.user.id,
				parsedData.user.username
			)
			const payload = { id: user.id }
			if (!user.wasOpened && user.inviterRefCode) {
				const inviter = await this.userService.getUserByRefCode(
					user.inviterRefCode
				)

				const metaTag = await this.prisma.metaTag.findFirst({
					where: {
						userId: user.id
					}
				})

				if (inviter) {
					try {
						await this.bot.telegram.sendMessage(
							inviter.telegramId,
							'Your friend Joined Meme Factory!',
							{
								parse_mode: 'HTML',
								reply_markup: Markup.inlineKeyboard([
									Markup.button.webApp("Lanuch now", process.env.APP_URL + "/friends")
								  ]).reply_markup
							}
						)
					} 
					catch (err) {
						console.log("Unable to send ref added message to inviter", err.name, err.message)
					}

					await this.transactionService.createTransaction({
						toUserId: inviter.id,
						amount: new Decimal(5000),
						type: TransactionType.REFERAL
					})
				}

				await this.prisma.user.update({
					where: {
						id: user.id
					},
					data: {
						wasOpened: true
					}
				})
			}
			return {
				user: user,
				token: await this.jwtService.signAsync(payload)
			}
		} catch (e) {
			throw new UnauthorizedException()
		}
	}

	async getUserById(id: number) {
		const user = await this.userService.getUserById(id)

		if (!user) {
			throw new NotFoundException()
		}

		return user
	}
}
