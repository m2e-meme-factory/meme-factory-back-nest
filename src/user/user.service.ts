import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { v4 as uuidv4 } from 'uuid'
import { IUser } from './types/user.types'
import { User, UserRole } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

@Injectable()
export class UserService {
	constructor(private readonly prisma: PrismaService) { }

	// func for test
	// async createUser(createUserDto: CreateUserDto): Promise<IUser> {
	// 	const { telegramId, username, isBaned, isVerified, inviterRefCode } =
	// 		createUserDto

	// 	const existingUser = await this.prisma.user.findUnique({
	// 		where: { telegramId }
	// 	})

	// 	if (existingUser) {
	// 		throw new BadRequestException('User with this telegramId already exists')
	// 	}

	// 	const refCode = uuidv4()

	// 	const user = await this.prisma.user.create({
	// 		data: {
	// 			telegramId,
	// 			username,
	// 			isBaned: isBaned ?? false,
	// 			isVerified: isVerified ?? false,
	// 			inviterRefCode: inviterRefCode || null,
	// 			refCode
	// 		}
	// 	})

	// 	return user
	// }

	// real func
	async findOrCreateUser(
		telegramId: number,
		username?: string,
		inviterRefCode?: string,
		role: 'creator' | 'advertiser' = 'creator',
		metaTag?: string
	) {
		let isFounded = false
		let user = await this.prisma.user.findUnique({
			where: {
				telegramId: telegramId.toString()
			}
		})
		if(user) {
			isFounded = true
		}

		if (!user) {
			const refCode = uuidv4()

			user = await this.prisma.user.create({
				data: {
					telegramId: telegramId.toString(),
					username: username || undefined,
					isBaned: false,
					isVerified: false,
					inviterRefCode: inviterRefCode || null,
					refCode,
					role: role,
					MetaTag: metaTag ? { create: { tag: metaTag } } : undefined
				}
			})
			// const userInfo =
			await this.prisma.userInfo.create({
				data: {
					userId: user.id
				}
			})
			const existingMetaTag = await this.prisma.metaTag.findFirst({
				where: { tag: metaTag, userId: user.id }
			})
			if (!existingMetaTag && metaTag) {
				await this.prisma.metaTag.create({
					data: {
						tag: metaTag,
						userId: user.id
					}
				})
			}
		}
		return {user,isFounded}
	}

	async isUserVerified(userId: string): Promise<{ isUser: boolean }> {
		if (!userId) {
			throw new BadRequestException('user_id is required')
		}

		const user = await this.prisma.user.findUnique({
			where: { telegramId: userId }
		})

		return { isUser: user ? user.isVerified : false }
	}

	async verifyUser(telegramId: string): Promise<IUser> {
		if (!telegramId) {
			throw new BadRequestException('user_id is required')
		}

		const user = await this.prisma.user.findUnique({
			where: { telegramId: telegramId }
		})

		if (!user) {
			throw new NotFoundException('User not found')
		}

		if (user.isVerified) {
			return user
		}

		const updatedUser = await this.prisma.user.update({
			where: { telegramId: telegramId },
			data: { isVerified: true }
		})

		return updatedUser
	}

	async getReferalsCount(
		telegramId: string
	): Promise<{ count: number; refLink: string }> {
		if (!telegramId) {
			throw new BadRequestException('telegramId is required')
		}

		const user = await this.prisma.user.findUnique({
			where: { telegramId },
			select: { refCode: true }
		})

		if (!user || !user.refCode) {
			throw new BadRequestException(
				'User with the provided telegramId does not exist or does not have a refCode'
			)
		}

		const count = await this.prisma.user.count({
			where: { inviterRefCode: user.refCode }
		})
		// TODO: get bot name from bot.telegram.me or .env
		const refLink = `https://t.me/mf_ton_bot?start=${user.refCode}`

		return { count, refLink }
	}

	//query param
	async getUserData(userId: string): Promise<IUser> {
		if (!userId) {
			throw new BadRequestException('user_id is required')
		}

		const user = await this.prisma.user.findUnique({
			where: { telegramId: userId }
		})

		if (!user) {
			throw new NotFoundException('User not found')
		}

		return user
	}
	async getAllUsers(): Promise<IUser[]> {
		const users = await this.prisma.user.findMany()

		return users
	}

	//url param
	async getUserById(userId: number): Promise<IUser> {
		const user = await this.prisma.user.findUnique({
			where: {
				id: userId
			}
		})

		return user
	}
	async getUserByTelegramId(telegramId: number): Promise<IUser> {
		const user = await this.prisma.user.findUnique({
			where: {
				telegramId: telegramId.toString()
			}
		})

		return user
	}
	async getUserByRefCode(refCode: string): Promise<IUser> {
		const user = await this.prisma.user.findFirst({
			where: {
				refCode: refCode
			}
		})

		return user
	}

	async updateUserRole(id: number, role: UserRole): Promise<User> {
		try {
			const user = await this.prisma.user.update({
				where: { id },
				data: { role }
			})

			return user
		} catch (error) {
			throw new InternalServerErrorException(
				`Ошибка при обновлении роли пользователя: ${error}`
			)
		}
	}
	async updateUserBalance(id: number, balance: Decimal): Promise<User> {
		try {
			const user = await this.prisma.user.update({
				where: { id },
				data: { balance: balance.toString() }
			})

			return user
		} catch (error) {
			throw new InternalServerErrorException(
				`Ошибка при обновлении баланса пользователя: ${error}`
			)
		}
	}

	async updateUserBalanceByUserId(
		userId: number,
		amount: Decimal,
		isAdd: boolean = true
	) {
		try {
			const user = await this.prisma.user.findUnique({
				where: { id: userId },
				select: { balance: true }
			})

			if (!user) {
				throw new NotFoundException(`User с ID ${userId} не найден`)
			}

			if (!isAdd && user.balance.lessThan(amount)) {
				throw new Error('Недостаточно средств')
			}

			const updatedUser = await this.prisma.user.update({
				where: { id: userId },
				data: {
					balance: isAdd ? { increment: amount } : { decrement: amount }
				},
				select: { balance: true }
			})

			return updatedUser.balance
		} catch (error) {
			if (error.message === 'Недостаточно средств') {
				throw new Error(error.message)
			}
			throw new NotFoundException(`User с ID ${userId} не найден`)
		}
	}

	// async getUserBalanceByUserId(userId: number) {
	// 	try {
	// 		const user = await this.prisma.user.findUnique({ where: { id: userId } })

	// 		return user.balance
	// 	} catch (error) {
	// 		throw new NotFoundException(`User с ID ${userId} не найден`)
	// 	}
	// }
}
