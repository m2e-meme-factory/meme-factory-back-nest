import { Injectable, NotFoundException } from '@nestjs/common'
import { Transaction, TransactionType } from '@prisma/client'
import {
	CreateTransactionDto,
	SumTransactionByTypeDto,
	UpdateTransactionDto
} from './dto/transaction.dto'
import { PrismaService } from 'src/prisma/prisma.service'
import { UserService } from 'src/user/user.service'
import { Decimal } from '@prisma/client/runtime/library'

const REF_PERSENTAGE = 0.1;

@Injectable()
export class TransactionService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly userService: UserService
	) {}

	async createReferalTransaction (taskId: number, invitedUserId: number, reward: number) {
		const user = await this.prisma.user.findFirst({
			where: {
				id: invitedUserId
			}
		})

		if (!user.inviterRefCode) return; 

			const inviter = await this.prisma.user.findFirst({
				where: {
					refCode: user.inviterRefCode
				}
			})
			
		if (!invitedUserId) return;

		const createTransactionDto: CreateTransactionDto = {
			taskId,
			toUserId: inviter.id,
			amount: new Decimal(reward * REF_PERSENTAGE),
			type: TransactionType.REFERAL
		}

		return this.createTransaction(createTransactionDto)
	}

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

	
	async sumByType(dto: SumTransactionByTypeDto) {
		return this.prisma.transaction.aggregate({
			where: { 
				toUserId: dto.toUserId,
				type: dto.type
			},
			_sum: {
				amount: true
			}
		})
	}
}
