import { Markup } from 'telegraf';
import { Injectable } from '@nestjs/common';
import { contentData, IContentSection } from './telegram.data';
import {  interval } from 'rxjs';
import { takeWhile, concatMap } from 'rxjs/operators';
import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { SceneContext, SceneSession } from 'telegraf/typings/scenes';
import { PublicRoute } from 'src/auth/decorators/public-route.decorator';

export const SEQUENCE_SCENE_ID = 'MESSAGE_SEQUENCE_SCENE';
const SEQUENCE_STEP_DURATION = 20000;

@Injectable()
@Scene(SEQUENCE_SCENE_ID)
export class MessageSequenceScene {
    private contentSequence: IContentSection[] = [
        contentData.first,
        contentData.memeFactory,
        contentData.airdrop,
        contentData.sky,
        contentData.firstAdvertiser,
    ];

    @PublicRoute()
    @SceneEnter()
    async enter(@Ctx() ctx: SceneContext & { session: SceneSession & {messageIndex: number} }) {
        ctx.session.messageIndex = 0; // Reset message index for each new session
        console.log('Scene entered, starting sequence...');
        await this.sendContent(ctx, this.contentSequence[ctx.session.messageIndex]);
        this.startSequence(ctx);
    }

    @PublicRoute()
    @Action('next')
    async action(@Ctx() ctx: SceneContext & { session: SceneSession & {messageIndex: number} }) {
        ctx.session.messageIndex++;
        if (ctx.session.messageIndex < this.contentSequence.length) {
            await this.sendContent(ctx, this.contentSequence[ctx.session.messageIndex]);
        } else {
            await ctx.reply('Сообщения завершены.');
            console.log('All messages sent. Sequence complete.');
        }
    }

    private startSequence(ctx: SceneContext & { session: SceneSession & {messageIndex: number} }) {
        interval(SEQUENCE_STEP_DURATION).pipe(
            takeWhile(() => ctx.session.messageIndex < this.contentSequence.length),
            concatMap(() => {
                ctx.session.messageIndex++;
                if (ctx.session.messageIndex < this.contentSequence.length) {
                    return this.sendContent(ctx, this.contentSequence[ctx.session.messageIndex]);
                } else {
                    ctx.reply('Сообщения завершены.');
                    console.log('All messages sent. Sequence complete.');
                    return Promise.resolve();
                }
            }),
        ).subscribe();
    }

    private async sendContent(ctx: SceneContext, content: IContentSection) {
        const webAppUrl = process.env.APP_URL;
        const { caption, contentUrl, buttonText } = content;

        const replyMarkup = Markup.inlineKeyboard([
            Markup.button.callback(buttonText || 'Далее', 'next'),
            Markup.button.webApp('Открыть приложение', `${webAppUrl}/projects`)
        ]);

        try {
            if (contentUrl) {
                if (contentUrl.endsWith('.mp4')) {
                    await ctx.replyWithVideo(
                        { url: contentUrl },
                        { caption, ...replyMarkup }
                    );
                } else {
                    await ctx.replyWithPhoto(
                        { url: contentUrl },
                        { caption, ...replyMarkup }
                    );
                }
            } else {
                await ctx.reply(caption, replyMarkup);
            }
        } catch (error) {
            console.error(`Failed to send content: ${error.message}`);
        }
    }
}
