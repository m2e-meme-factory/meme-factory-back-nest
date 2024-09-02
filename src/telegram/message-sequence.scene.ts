// message-sequence.scene.ts
import { Scenes, Markup } from 'telegraf'
import { Injectable } from '@nestjs/common'
import { contentData, IContentSection } from './telegram.data'
import { Subject, of } from 'rxjs'
import { concatMap, delay } from 'rxjs/operators'
import { MyContext } from './telegram.context'

export const SEQUENCE_SCENE_ID = 'MESSAGE_SEQUENCE_SCENE'
const SEQUENCE_STEP_DURATION = 20000

@Injectable()
export class MessageSequenceScene {
	private messageIndex = 0
	private sequenceSubject = new Subject<void>()

	private contentSequence: IContentSection[] = [
		contentData.first,
		contentData.memeFactory,
		contentData.airdrop,
		contentData.sky,
		contentData.firstAdvertiser
	]

	get scene() {
		const scene = new Scenes.BaseScene<MyContext>(SEQUENCE_SCENE_ID)

		scene.enter(async ctx => {
			this.messageIndex = 0
			this.startSequence(ctx)
		})

		scene.action('next', async () => {
			this.messageIndex++
			this.sequenceSubject.next()
		})

		scene.leave(() => {
			this.sequenceSubject.complete()
		})

		return scene
	}

	private startSequence(ctx: MyContext) {
		of(...this.contentSequence)
			.pipe(
				concatMap(async content => {
					await this.sendContent(ctx, content)
					this.messageIndex++
					this.sequenceSubject.next()
				}),
				delay(SEQUENCE_STEP_DURATION)
			)
			.subscribe()
	}

	private async sendContent(ctx: MyContext, content: IContentSection) {
		const webAppUrl = process.env.APP_URL
		const { caption, contentUrl, buttonText } = content

		const replyMarkup = Markup.inlineKeyboard([
			Markup.button.callback(buttonText || 'Далее', 'next'),
			Markup.button.webApp('Открыть приложение', `${webAppUrl}/projects`)
		])

		if (contentUrl) {
			if (contentUrl.endsWith('.mp4')) {
				await ctx.replyWithVideo(
					{ url: contentUrl },
					{ caption, ...replyMarkup }
				)
			} else {
				await ctx.replyWithPhoto(
					{ url: contentUrl },
					{ caption, ...replyMarkup }
				)
			}
		} else {
			await ctx.reply(caption, replyMarkup)
		}
	}
}
