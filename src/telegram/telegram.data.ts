export interface IContentSection {
	caption: string
	contentUrl?: string
	buttonText?: string
}

export const contentData: {
	first: IContentSection
	memeFactory: IContentSection
	airdrop: IContentSection
	sky: IContentSection
	firstAdvertiser: IContentSection
} = {
	first: {
		caption: `
Приветствую тебя, Создатель!

С нами ты можешь стать мощным инфлюенсером и продвигать бренды со всего мира!
        `,
		contentUrl:
			`${process.env.APP_URL}/uploads/default/3d2547be-a98a-401f-b7fe-3d2304725bb0_first-image.jpg`
	},

	memeFactory: {
		caption: `
Meme Factory - первая Meme-To-Earn платформа, где люди постят мемы и зарабатывают на этом,
а бренды повышают узнаваемость за счет рекламных интеграций.
        `
	},

	airdrop: {
		caption: `
Как получить Airdrop и заработать (в 1-2 сообщении):
- Приглашай друзей 10 000
- Выкладывай в соцсети контент о проекте
- Отмечай нас в соцсетях
- Делай активности (комментируй, лайкай и т.д.)
И участвуй в эйрдроп
        `,
		contentUrl:
			`${process.env.APP_URL}/uploads/default/0ee3df42-66a3-4765-9437-35321a2d4e74_airdrop.jpg`
	},

	sky: {
		caption: `
Меня зовут Скай, я помогаю брендам улетать в небеса, ха-ха

Я расскажу тебе, как мы тут работаем. Все просто, как никогда!

1. Берем популярный мем на английском языке, либо создаем уникальный
2. Скачиваем промо материалы от рекламодателя (анимацию)
3. Накладываем анимацию/лого/текст
4. Указываем аккаунт рекламодателя соавтором или упоминаем его

Нажми "Начинаем" и я передам тебя твоему первому заказчику!
        `,
		contentUrl: `${process.env.APP_URL}/uploads/default/3e15e586-3b00-4bfe-bac1-3f80fdd51786_sky.jpg`,
		buttonText: 'Начинаем'
	},

	firstAdvertiser: {
		caption: `
Тебя приветствует твой первый заказчик - Фабрика Мемов (Meme Factory)

Мы хотим, чтобы о нас знали везде и нам нужна твоя помощь!
Выкладывай контент в соцсетях и получай поинты ЕЖЕДЕНЕВНО

Я - Ник, твой первый заказчик.
Давай расскажу, как тут все работает!

Нажми "Запустить Фабрику" и мы начнем
        `,
		contentUrl:
			`${process.env.APP_URL}/uploads/default/9073e0ad-9337-41e2-b2da-4eff8a7758d6_first advertiser.jpg`,
		buttonText: 'Запустить Фабрику'
	}
}
