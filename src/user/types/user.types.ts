import { UserRole } from "@prisma/client"

export interface IUser {
	id: number
	telegramId: string
	username: string
	balance: number
	isBaned: boolean
	isVerified: boolean
	createdAt: Date
	inviterRefCode: string
	refCode: string
	role: UserRole
}
