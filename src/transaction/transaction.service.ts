import { Injectable, NotFoundException } from '@nestjs/common'
import { Transaction } from '@prisma/client'
import { CreateTransactionDto, UpdateTransactionDto } from './dto/transaction.dto'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class TransactionService {
	constructor(private readonly prisma: PrismaService) {}

	async createTransaction(data: CreateTransactionDto): Promise<Transaction> {
		return this.prisma.transaction.create({
			data
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
            OR: [
              { fromUserId: userId },
              { toUserId: userId },
            ],
          },
        });
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
