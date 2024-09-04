import { Markup } from 'telegraf'
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
		contentData.airdrop,
		contentData.sky,
		contentData.firstAdvertiser,
	]
	private againMessage = contentData.againMessage

	@PublicRoute()
	@SceneEnter()
	async enter(
		@Ctx()
		ctx: SceneContext & { session: SceneSession & { messageIndex: number, lastMessageId: number } }
	) {
		const user = await this.prisma.user.findFirst({
			where: { telegramId: String(ctx.from.id) }
		})
		ctx.session.messageIndex = 0
		ctx.session.lastMessageId = null

		if (!user.isSended) {
			console.log('Scene entered, starting sequence...')
			await this.sendContent(
				ctx,
				this.contentSequence[ctx.session.messageIndex]
			)
		}

		this.startSequence(ctx, user)
	}

	@PublicRoute()
	@Action('next')
	async action(
		@Ctx()
		ctx: SceneContext & { session: SceneSession & { messageIndex: number, lastMessageId: number } }
	) {
		ctx.session.messageIndex++
		if (ctx.session.messageIndex < this.contentSequence.length) {
			await this.sendContent(
				ctx,
				this.contentSequence[ctx.session.messageIndex]
			)
		} else {
			await ctx.reply('Сообщения завершены.')
			console.log('All messages sent. Sequence complete.')
		}
	}

	private async startSequence(
		ctx: SceneContext & { session: SceneSession & { messageIndex: number, lastMessageId: number } },
		user: User
	) {
		if (user.isSended) {
			await this.sendContent(ctx, this.againMessage)
		} else {
			interval(SEQUENCE_STEP_DURATION)
				.pipe(
					takeWhile(
						() => ctx.session.messageIndex < this.contentSequence.length
					),
					concatMap(async () => {
						ctx.session.messageIndex++
						if (ctx.session.messageIndex < this.contentSequence.length) {
							return this.sendContent(
								ctx,
								this.contentSequence[ctx.session.messageIndex]
							)
						} else {
							await ctx.reply('Сообщения завершены.')
							console.log('All messages sent. Sequence complete.')
							await this.prisma.user.update({
								where: {
									id: user.id
								},
								data: {
									isSended: true
								}
							})
							return Promise.resolve()
						}
					})
				)
				.subscribe()
		}
	}

	private async sendContent(ctx: SceneContext & { session: SceneSession & { lastMessageId: number } }, content: IContentSection) {
		const webAppUrl = process.env.APP_URL
		const { caption, contentUrl, buttonText } = content

		const replyMarkup = Markup.inlineKeyboard([
			buttonText === 'Запустить Фабрику' || buttonText === 'Открыть приложение'
				? Markup.button.webApp(buttonText, `${webAppUrl}/projects`)
				: Markup.button.callback(buttonText || 'Далее', 'next')
		])

		try {
			// Удаляем кнопки с предыдущего сообщения
			if (ctx.session.lastMessageId) {
				await ctx.telegram.editMessageReplyMarkup(
					ctx.chat.id,
					ctx.session.lastMessageId,
					null,
					// Передаем пустую клавиатуру, чтобы убрать кнопки
					{ inline_keyboard: [] }
				)
			}

			// Отправляем новое сообщение и сохраняем его ID
			let message
			if (contentUrl) {
				if (contentUrl.endsWith('.mp4')) {
					message = await ctx.replyWithVideo(
						{ url: contentUrl },
						{ caption, ...replyMarkup }
					)
				} else {
					message = await ctx.replyWithPhoto(
						{ url: contentUrl },
						{ caption, ...replyMarkup }
					)
				}
			} else {
				message = await ctx.reply(caption, replyMarkup)
			}

			// Сохраняем ID последнего сообщения
			ctx.session.lastMessageId = message.message_id

		} catch (error) {
			console.error(`Failed to send content: ${error.message}`)
		}
	}
}
