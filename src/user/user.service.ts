import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { CreateUserDto } from './dto/user.dto'
import { v4 as uuidv4 } from 'uuid'
import { IUser } from './types/user.types'

@Injectable()
export class UserService {
	constructor(private readonly prisma: PrismaService) {}

	// func for test
	async createUser(createUserDto: CreateUserDto): Promise<IUser> {
		const { telegramId, username, isBaned, isVerified, inviterRefCode } =
			createUserDto

		const existingUser = await this.prisma.user.findUnique({
			where: { telegramId }
		})

		if (existingUser) {
			throw new BadRequestException('User with this telegramId already exists')
		}

		const refCode = uuidv4()

		const user = await this.prisma.user.create({
			data: {
				telegramId,
				username,
				isBaned: isBaned ?? false,
				isVerified: isVerified ?? false,
				inviterRefCode: inviterRefCode || null,
				refCode
			}
		})

		return user
	}

	// real func
	async findOrCreateUser(telegramId: number, username: string, inviterRefCode?: string) {
		const user = await this.prisma.user.findUnique({
			where: {
				telegramId: telegramId.toString()
			}
		})

		if (!user) {
			const refCode = uuidv4()

			const user = await this.prisma.user.create({
				data: {
					telegramId: telegramId.toString(),
					username,
					isBaned: false,
					isVerified: false,
					inviterRefCode: inviterRefCode || null,
					refCode
				}
			})

			return user
		}
		return user
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

	async verifyUser(userId: string): Promise<IUser> {
		if (!userId) {
			throw new BadRequestException('user_id is required')
		}

		const user = await this.prisma.user.findUnique({
			where: { telegramId: userId }
		})

		if (!user) {
			throw new NotFoundException('User not found')
		}

		if (user.isVerified) {
			return user
		}

		const updatedUser = await this.prisma.user.update({
			where: { telegramId: userId },
			data: { isVerified: true }
		})

		return updatedUser
	}

	async getReferalsCount(telegramId: string): Promise<{ count: number, refLink: string }> {
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
		
		const refLink = `t.me/bot_name/?start=${user.refCode}`

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

	// Дополнительные методы для задачи и веб-запроса
	// private async createTaskForUser(userId: string) {
	//   // Логика по созданию задачи для пользователя
	// }

	// private async processWebQuery(queryId: string) {
	//   // Логика по обработке веб-запроса
	// }
}
