import { Context as TelegrafContext, Scenes } from 'telegraf'

export interface MyContext extends TelegrafContext {
	scene: Scenes.SceneContextScene<MyContext>
}
