import { Context, Markup, Telegraf } from 'telegraf'
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
	constructor(
		private readonly prisma: PrismaService,
		// private readonly bot: Telegraf<Context>,
	) { }
	private contentSequence: IContentSection[] = [
		contentData.first,
		contentData.memeFactory,
		contentData.airdrop,
		contentData.sky,
		contentData.firstAdvertiser
	]
	private againMessage = contentData.againMessage;

	private fileIds: { [url: string]: string; } = {};



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

		// if (!user.isSended) {
		// 	console.log('Scene entered, starting sequence...')
		// 	await this.sendContent(
		// 		ctx,
		// 		this.contentSequence[ctx.session.messageIndex]
		// 	)
		// 	this.startSequence(ctx, user)
		// } else {

		const contentUrl = "./assets/first-advertiser.jpg";
		const file = this.fileIds[contentUrl] ? this.fileIds[contentUrl] : { source: contentUrl };

		const inviteLink = `https://t.me/${"miniapped_v2_bot"}?start=${user.refCode}`

		const verifyKeyboard = (isVerefied: boolean) => {
			let keyboard = [
				{
					"text": "Invite Friends",
					"switch_inline_query": `
Join me on Meme Factory and let's earn together! 
Use my invite link to join the fun.👑
${inviteLink}
`
				},
			]

			if (!isVerefied)
				keyboard.push(

				)
		}

		const replyMarkup = {
			inline_keyboard: [
				[
					Markup.button.webApp("Launch", process.env.APP_URL + "/projects")
				],
				[
					{
						"text": "Invite Friends",
						"switch_inline_query": `
Join me on Meme Factory and let's earn together! 
Use my invite link to join the fun.👑
${inviteLink}
`
					},
					Markup.button.webApp("⭐️ Verify", process.env.APP_URL + "/profile")
				],
				[
					Markup.button.url("Join Community", "https://t.me/m2e_pro")
				],
			]
	}

	const caption = `
Welcome to Meme Factory! 🎉🎉🎉

MemeFactory is a service where people post memes and earn money from it, and brands increase awareness through advertising integrations

Here’s what you can do with Meme Factory now to increase Airdrop chance:
🧑 Invite Friends: Bring your friends and family for more M2E! More friends = more chance for Airdrop
🥊 Complete Quests: Finish tasks to rack up even more M2E!

Want 100% chance for Airdrop? 
⭐️ Verify now (Launch app)
			`

			let message;
if (contentUrl.endsWith('.mp4')) {
	message = await ctx.replyWithVideo(
		file,
		{
			caption,
			reply_markup: replyMarkup,
			parse_mode: "HTML"
		}
	)
	this.fileIds[contentUrl] = message.video.file_id
} else {
	message = await ctx.replyWithPhoto(
		file,
		{ caption, reply_markup: replyMarkup, parse_mode: "HTML" }
	)
	this.fileIds[contentUrl] = message.photo.file_id
}

			// await this.sendContent(ctx, this.againMessage)
		// }
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
		let file: {
			source: string;
		} | {
			url: string;
		} | string = contentUrl.startsWith("./assets") ? {
			source: contentUrl
		} : {
				url: contentUrl
			}

		if (this.fileIds[contentUrl]) {
			file = this.fileIds[contentUrl]
		}




		let message;
		if (contentUrl) {
			if (contentUrl.endsWith('.mp4')) {
				message = await ctx.replyWithVideo(
					file,
					{ caption, ...replyMarkup, parse_mode: "HTML" }
				)
				this.fileIds[contentUrl] = message.video.file_id
			} else {
				message = await ctx.replyWithPhoto(
					file,
					{ caption, ...replyMarkup, parse_mode: "HTML" }
				)
				this.fileIds[contentUrl] = message.photo.file_id
			}
		} else {
			message = await ctx.replyWithHTML(caption, replyMarkup)
		}

		ctx.session.lastMessageId = message.message_id
	} catch (error) {
		console.error(`Failed to send content: ${error.message}`)
	}
}
}
