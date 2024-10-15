import { Injectable, NotFoundException } from '@nestjs/common'
import { Transaction, TransactionType } from '@prisma/client'
import {
	CreateTransactionDto,
	UpdateTransactionDto
} from './dto/transaction.dto'
import { PrismaService } from 'src/prisma/prisma.service'
import { UserService } from 'src/user/user.service'
// import { Decimal } from '@prisma/client/runtime/library'

@Injectable()
export class TransactionService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly userService: UserService
	) {}

	async createTransaction(data: CreateTransactionDto): Promise<Transaction> {
		return this.prisma.$transaction(async prisma => {
			if (data.fromUserId) {
				await this.userService.updateUserBalanceByUserId(
					data.fromUserId,
					data.amount,
					false
				)
			}

			if (data.toUserId) {
				await this.userService.updateUserBalanceByUserId(
					data.toUserId,
					data.amount,
					data.type === TransactionType.WITHDRAWAL ? false : true
				)
			}

			const transaction = await prisma.transaction.create({
				data
			})

			return transaction
		})
	}

	async findAll(): Promise<Transaction[]> {
		return this.prisma.transaction.findMany()
	}

	async findOne(id: number): Promise<Transaction> {
		const transaction = await this.prisma.transaction.findUnique({
			where: { id }
		})
		if (!transaction) {
			throw new NotFoundException(`Transaction with ID ${id} not found`)
		}
		return transaction
	}

	async findUserTransactions(userId: number): Promise<Transaction[]> {
		return this.prisma.transaction.findMany({
			where: {
				OR: [{ fromUserId: userId }, { toUserId: userId }]
			},
			include: {
				toUser: true,
				fromUser: true
			},
			orderBy: {
				createdAt: "desc"
			}
		})
	}

	async update(id: number, data: UpdateTransactionDto): Promise<Transaction> {
		const transaction = await this.prisma.transaction.update({
			where: { id },
			data
		})
		if (!transaction) {
			throw new NotFoundException(`Transaction with ID ${id} not found`)
		}
		return transaction
	}

	async delete(id: number): Promise<Transaction> {
		const transaction = await this.prisma.transaction.delete({
			where: { id }
		})
		if (!transaction) {
			throw new NotFoundException(`Transaction with ID ${id} not found`)
		}
		return transaction
	}
}
