export interface IUser {
	id: number
	telegramId: string
	username: string
	isBaned: boolean
	isVerified: boolean
	createdAt: Date
	inviterRefCode: string
	refCode: string
}
