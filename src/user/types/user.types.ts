import { UserRole } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"

export interface IUser {
	id: number
	telegramId: string
	username: string
	balance: Decimal
	isBaned: boolean
	isVerified: boolean
	createdAt: Date
	inviterRefCode: string
	refCode: string
	role: UserRole
}
