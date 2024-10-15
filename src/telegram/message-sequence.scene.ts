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
		// contentData.sky,
		// contentData.firstAdvertiser
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

		if (!user.isSended) {
			console.log('Scene entered, starting sequence...')
			await this.sendContent(
				ctx,
				this.contentSequence[ctx.session.messageIndex]
			)
			this.startSequence(ctx, user)
		} else {

			const contentUrl = "./assets/first-advertiser.jpg";
			const file = this.fileIds[contentUrl] ? this.fileIds[contentUrl] : { source: contentUrl };

			const inviteLink = `https://t.me/${"mf_ton_bot"}?start=${user.refCode}`

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
Welcome to Meme Factory! 

- Post memes 
- Invite Friends
- Follow us in socials
🎉 Claim Airdrop!

Want 100% Airdrop whitelist? 
⭐️ Verify now
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
		}
	}

	async sendLastMessage(ctx: SceneContext, text) {
		console.log("last message, in here")
		const user = await this.prisma.user.findFirst({
			where: { telegramId: String(ctx.from.id) }
		})
			const inviteLink = `https://t.me/${"mf_ton_bot"}?start=${user.refCode}`

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

			console.log(await ctx.replyWithHTML(text, {
				reply_markup: replyMarkup
			}));
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
			console.log(this.contentSequence[ctx.session.messageIndex])
			await this.sendContent(
				ctx,
				this.contentSequence[ctx.session.messageIndex]
			)
		} else {
			console.log("last message")
			await this.sendLastMessage(ctx, contentData.airdrop.caption)

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

		// ctx.session.isUpdating = false
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
		const { caption, contentUrl, buttonText, isLast } = content
		
		if (isLast) {
			await this.sendLastMessage(ctx, caption);
			return;
		}

		let message;

		if (contentUrl) {

			const file = this.fileIds[contentUrl] ? this.fileIds[contentUrl] : { source: contentUrl };

			if (contentUrl.endsWith('.mp4')) {
				message = await ctx.replyWithVideo(
					file,
					{
						caption,
						reply_markup: Markup.inlineKeyboard([
							Markup.button.callback(buttonText, "next")
						]).reply_markup,
						parse_mode: "HTML"
					}
				)
				this.fileIds[contentUrl] = message.video.file_id
			} else {
				message = await ctx.replyWithPhoto(
					file,
					{ caption,
						reply_markup: Markup.inlineKeyboard([
							Markup.button.callback(buttonText, "next")
						]).reply_markup,
						parse_mode: "HTML" }
				)
				this.fileIds[contentUrl] = message.photo.file_id
			}
		}
		else {
			message = await ctx.replyWithHTML(caption,
				{ 
					reply_markup: Markup.inlineKeyboard([
						Markup.button.callback(buttonText, "next")
					]).reply_markup 
				}
			)
		}

		ctx.session.lastMessageId = message.message_id



		// try {
		// 	if (ctx.session.lastMessageId) {
		// 		await ctx.telegram.editMessageReplyMarkup(
		// 			ctx.chat.id,
		// 			ctx.session.lastMessageId,
		// 			null,
		// 			{ inline_keyboard: [] }
		// 		)
		// 	}
		// 	let file: {
		// 		source: string;
		// 	} | {
		// 		url: string;
		// 	} | string = contentUrl.startsWith("./assets") ? {
		// 		source: contentUrl
		// 	} : {
		// 			url: contentUrl
		// 		}

		// 	if (this.fileIds[contentUrl]) {
		// 		file = this.fileIds[contentUrl]
		// 	}




		// 	let message;
		// 	if (contentUrl) {
		// 		if (contentUrl.endsWith('.mp4')) {
		// 			message = await ctx.replyWithVideo(
		// 				file,
		// 				{ caption, ...replyMarkup, parse_mode: "HTML" }
		// 			)
		// 			this.fileIds[contentUrl] = message.video.file_id
		// 		} else {
		// 			message = await ctx.replyWithPhoto(
		// 				file,
		// 				{ caption, ...replyMarkup, parse_mode: "HTML" }
		// 			)
		// 			this.fileIds[contentUrl] = message.photo.file_id
		// 		}
		// 	} else {
		// 		message = await ctx.replyWithHTML(caption, replyMarkup)
		// 	}

		// 	ctx.session.lastMessageId = message.message_id
		// } catch (error) {
		// 	console.error(`Failed to send content: ${error.message}`)
		// }
	}
}
