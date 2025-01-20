// src/telegram-bot/scenes/form.scene.ts
import { Scene, SceneEnter, On, Ctx, Action } from 'nestjs-telegraf';
import { PublicRoute } from '../auth/decorators/public-route.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { Markup } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';

export const FIRSTTIME_SCENE_ID = 'firstTimeScene'

@Scene(FIRSTTIME_SCENE_ID)  // Имя сцены
export class FirstTimeScene {
    constructor(
		private readonly prisma: PrismaService,
      ) { }
private fileIds: { [url: string]: string; } = {};

@PublicRoute()
  @SceneEnter()  // Этот метод вызывается при входе в сцену
  async onEnter(@Ctx() ctx: SceneContext) {
    const user = await this.prisma.user.findFirst({
        where: { telegramId: String(ctx.from.id) }
    })

    if (user.isSended) {
        await this.sendAgainMessage(ctx, user.refCode);
        
        return ctx.scene.leave();
    }

    await this.onFisrtTime(ctx)
  }

  async sendAgainMessage(@Ctx() ctx: SceneContext, refCode: string) {
    
			const contentUrl = "./assets/first-advertiser.jpg";
			const file = this.fileIds[contentUrl] ? this.fileIds[contentUrl] : { source: contentUrl };

			const inviteLink = `https://t.me/${"mf_ton_bot"}?start=${refCode}`

			const replyMarkup = {
				inline_keyboard: [
					[
						Markup.button.webApp("Launch", process.env.APP_URL + "/profile")
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
						// Markup.button.webApp("⭐️ Verify", process.env.APP_URL + "/profile")
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

⭐️ Begin earning with meme factory now!
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
  }

  async onFisrtTime(@Ctx() ctx: SceneContext) {
    await ctx.replyWithHTML(`
Welcome to Meme Factory! 🎉

Meme Factory is a platform where you can post memes, earn M2E points, and participate in an Airdrop! 

It's simple: create memes, upload them through our platform, get views, and earn rewards. 

🚀 Soon, other advertisers will join, ready to pay for your creativity!
            `, {
                reply_markup: Markup.inlineKeyboard([
                    Markup.button.callback("Let's Go!", "earn")
                ]).reply_markup
            });
  }

  @PublicRoute()
  @Action("earn")
  async onEarn(@Ctx() ctx: SceneContext) {
    const message = `
Right now, Meme Factory is your first advertiser. 

You earn M2E points for claiming Airdrop with different activities:
🧑 Invite Friends: Bring your friends and family for more M2E!
🥊 Complete Tasks: Finish tasks to rack up more M2E!
📣 Create Content: the moset valuable activity!

🔥 Help us launch the platform by posting memes and promoting the project, and be one of the first to receive a reward. 
`
    await ctx.replyWithHTML(message, {
        reply_markup: Markup.inlineKeyboard([
            Markup.button.callback("How to Earn TON?", "future")
        ]).reply_markup
    });
  }

  @PublicRoute()
  @Action("future")
  async onFuture(@Ctx() ctx: SceneContext) {
    const user = await this.prisma.user.findFirst({
        where: { telegramId: String(ctx.from.id) }
    })
        const inviteLink = `https://t.me/${"mf_ton_bot"}?start=${user.refCode}`

        const replyMarkup = {
            inline_keyboard: [
                [
                    Markup.button.webApp("Launch", process.env.APP_URL + "/profile")
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
                    // Markup.button.webApp("⭐️ Verify", process.env.APP_URL + "/profile")
                ],
                [
                    Markup.button.url("Join Community", "https://t.me/m2e_pro")
                ],
            ]
        }


    const message = `
Once we launch, top advertisers like exchanges and brands will join us. 
You’ll be able to complete tasks and start earning in TON! 

🤑 Now is the perfect time to become part of the project and level up your earning potential as the platform grows! 🌟

⭐️ Begin earning with meme factory now!
`
    await ctx.replyWithHTML(message, {
        reply_markup: replyMarkup
    });
    
    await this.prisma.user.update({
        where: {
            telegramId: user.telegramId,
        },
        data: { 
            isSended: true
        }
    })

    ctx.scene.leave()
  }
}
