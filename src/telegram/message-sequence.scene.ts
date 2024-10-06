import { Input, Markup } from 'telegraf'
import { Injectable } from '@nestjs/common'
import { contentData, IContentSection } from './telegram.data'
import { interval } from 'rxjs'
import { takeWhile, concatMap } from 'rxjs/operators'
import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf'
import { SceneContext, SceneSession } from 'telegraf/typings/scenes'
import { PublicRoute } from 'src/auth/decorators/public-route.decorator'
import { PrismaService } from 'src/prisma/prisma.service'
import { User } from '@prisma/client'

export const SEQUENCE_SCENE_ID = 'MESSAGE_SEQUENCE_SCENE'
const SEQUENCE_STEP_DURATION = 20000

@Injectable()
@Scene(SEQUENCE_SCENE_ID)
export class MessageSequenceScene {
	constructor(private readonly prisma: PrismaService) {}
	private contentSequence: IContentSection[] = [
		contentData.first,
		contentData.memeFactory,
		// contentData.airdrop,
		// contentData.sky,
		contentData.firstAdvertiser
	]
	private againMessage = contentData.againMessage

	@PublicRoute()
	@SceneEnter()
	async enter(
		@Ctx()
		ctx: SceneContext & {
			session: SceneSession & {
				messageIndex: number
				lastMessageId: number
				isUpdating: boolean
			}
		}
	) {
		const user = await this.prisma.user.findFirst({
			where: { telegramId: String(ctx.from.id) }
		})
		ctx.session.messageIndex = 0
		ctx.session.lastMessageId = null
		ctx.session.isUpdating = false

		if (!user.isSended) {
			console.log('Scene entered, starting sequence...')
			await this.sendContent(
				ctx,
				this.contentSequence[ctx.session.messageIndex]
			)
			this.startSequence(ctx, user)
		} else {
			console.log('Scene entered, starting sequence...')
			await this.sendContent(ctx, this.againMessage)
		}
	}

	@PublicRoute()
	@Action('next')
	async action(
		@Ctx()
		ctx: SceneContext & {
			session: SceneSession & {
				messageIndex: number
				lastMessageId: number
				isUpdating: boolean
			}
		}
	) {
		if (ctx.session.isUpdating) return
		ctx.session.isUpdating = true

		ctx.session.messageIndex++
		if (ctx.session.messageIndex < this.contentSequence.length) {
			await this.sendContent(
				ctx,
				this.contentSequence[ctx.session.messageIndex]
			)
		} else {
			await this.prisma.user.update({
				where: {
					telegramId: String(ctx.from.id)
				},
				data: {
					isSended: true
				}
			})
			console.log('All messages sent. Sequence complete.')
		}

		ctx.session.isUpdating = false
	}

	private async startSequence(
		ctx: SceneContext & {
			session: SceneSession & {
				messageIndex: number
				lastMessageId: number
				isUpdating: boolean
			}
		},
		user: User
	) {
		interval(SEQUENCE_STEP_DURATION)
			.pipe(
				takeWhile(() => ctx.session.messageIndex < this.contentSequence.length),
				concatMap(async () => {
					if (ctx.session.isUpdating) return 
					ctx.session.isUpdating = true 

					ctx.session.messageIndex++
					if (ctx.session.messageIndex < this.contentSequence.length) {
						await this.sendContent(
							ctx,
							this.contentSequence[ctx.session.messageIndex]
						)
					} else
						await this.prisma.user.update({
							where: {
								id: user.id
							},
							data: {
								isSended: true
							}
						})
					console.log('All messages sent by interval. Sequence complete.')

					ctx.session.isUpdating = false
				})
			)
			.subscribe()
	}

	private async sendContent(
		ctx: SceneContext & { session: SceneSession & { lastMessageId: number } },
		content: IContentSection
	) {
		const webAppUrl = process.env.APP_URL
		const { caption, contentUrl, buttonText } = content

		const replyMarkup = Markup.inlineKeyboard([
			buttonText === 'Запустить Фабрику' || buttonText === 'Открыть приложение'
				? Markup.button.webApp(buttonText, `${webAppUrl}/projects`)
				: Markup.button.callback(buttonText || 'Далее', 'next')
		])

		try {
			if (ctx.session.lastMessageId) {
				await ctx.telegram.editMessageReplyMarkup(
					ctx.chat.id,
					ctx.session.lastMessageId,
					null,
					{ inline_keyboard: [] }
				)
			}

			let message
			const input = Input.fromLocalFile("./assets/" + contentUrl)

			if (contentUrl) {
				if (contentUrl.endsWith('.mp4')) {
					message = await ctx.replyWithVideo(
						input,
						{ caption, ...replyMarkup }
					) 
				} else {
					message = await ctx.replyWithPhoto(
						input,
						{ caption, ...replyMarkup }
					)
				}
			} else {
				message = await ctx.reply(caption, replyMarkup)
			}

			ctx.session.lastMessageId = message.message_id
		} catch (error) {
			console.error(`Failed to send content: ${error.message}`)
		}
	}
}
