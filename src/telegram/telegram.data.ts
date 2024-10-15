
export interface IContentSection {
	caption: string
	contentUrl?: string
	buttonText?: string
	isLast?: boolean
}

export const contentData: {
	first: IContentSection
	memeFactory: IContentSection
	airdrop: IContentSection
	// sky: IContentSection
	// firstAdvertiser: IContentSection
	againMessage: IContentSection
} = {

	first: {
		caption: ` 
Welcome to Meme Factory! 🎉

Meme Factory is a platform where you can post memes, earn M2E points, and participate in an Airdrop! 

It's simple: create memes, upload them through our platform, get views, and earn rewards. 

🚀 Soon, other advertisers will join, ready to pay for your creativity!
        `,
		buttonText: "How it works?",
		contentUrl: `./assets/first-advertiser.jpg`,
		isLast: false,
	},

	memeFactory: {
		caption: `
Right now, Meme Factory is your first advertiser. 

You earn M2E points for claiming Airdrop with different activities:
🧑 Invite Friends: Bring your friends and family for more M2E!
🥊 Complete Tasks: Finish tasks to rack up more M2E!
📣 Create Content: the moset valuable activity!

🔥 Help us launch the platform by posting memes and promoting the project, and be one of the first to receive a reward. 
`,
		buttonText: "What's in future?",
		// contentUrl: `./`
		isLast: false,
	},

	airdrop: {
		caption: `
Once we launch, top advertisers like exchanges and brands will join us. 
You’ll be able to complete tasks and start earning in TON! 

🤑 Now is the perfect time to become part of the project and level up your earning potential as the platform grows! 🌟

Want 100% Airdrop whitelist? 
⭐️ Verify now
`,
isLast: true,
		// buttonText: 'Участвовать!',
		// contentUrl: `./first-advertiser.jpg`
	},

// 	sky: {
// 		caption: `
// Меня зовут Скай, я помогаю брендам улетать в небеса, ха-ха

// Я расскажу тебе, как мы тут работаем. Все просто, как никогда!

// 1. Берем популярный мем на английском языке, либо создаем уникальный
// 2. Скачиваем промо материалы от рекламодателя (анимацию)
// 3. Накладываем анимацию/лого/текст
// 4. Указываем аккаунт рекламодателя соавтором или упоминаем его

// Нажми "Начинаем" и я передам тебя твоему первому заказчику!
//         `,
// 		contentUrl: `https://api.meme-factory.site/uploads/default/3e15e586-3b00-4bfe-bac1-3f80fdd51786_sky.jpg`,
// 		buttonText: 'Начинаем!'
// 	},

// 	firstAdvertiser: {
// 		caption: `
// Тебя приветствует твой первый заказчик - Фабрика Мемов (Meme Factory)

// Мы хотим, чтобы о нас знали везде и нам нужна твоя помощь!
// Выкладывай контент в соцсетях и получай поинты ЕЖЕДЕНЕВНО

// Я - Ник, твой первый заказчик.
// Давай расскажу, как тут все работает!

// Нажми "Запустить Фабрику" и мы начнем
//         `,
// 		contentUrl: `https://api.meme-factory.site/uploads/default/eefd6e10-2b90-4f2d-ab9b-ab4ee1a2592f_first-advertiser.jpg`,
// 		buttonText: 'Запустить Фабрику'
// 	},
	againMessage: {
		caption: `
Welcome to Meme Factory! 

- Post memes 
- Invite Friends
- Follow us in socials
🎉 Claim Airdrop!

Want 100% Airdrop whitelist? 
⭐️ Verify now
        `,
		// contentUrl: "./assets/airdrop.jpg",
		// buttonText: 'Запустить Фабрику'
	}
}


/*

MemeFactory is a service where people post memes and earn money from it, and brands increase awareness through advertising integrations

Here’s what you can do with Meme Factory now to laim Airdrop:
🧑 Invite Friends: Bring your friends and family for more M2E! More friends = more chance for Airdrop
🥊 Complete Tasks: Finish tasks to rack up more M2E!
📣 Create Content: the moset valuable activity!

*/