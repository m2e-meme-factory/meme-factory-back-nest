import { Controller, Query, Req } from '@nestjs/common';
import { Body, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { Transaction } from '@prisma/client'
import { CreateTransactionDto, UpdateTransactionDto } from './dto/transaction.dto'
import { TransactionService } from './transaction.service';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

@Controller('transactions')
export class TransactionController {
    constructor(private readonly transactionService: TransactionService) {}

	@Post()
	async create(
		@Body() createTransactionDto: CreateTransactionDto
	): Promise<Transaction> {
		return this.transactionService.createTransaction(createTransactionDto)
	}

	@Get()
	async findAll(): Promise<Transaction[]> {
		return this.transactionService.findAll()
	}

    @Get('by-user')
    @ApiOperation({ summary: 'Получить историю транзакций пользователя' })
    @ApiQuery({ name: 'userId', type: Number, required: true, description: 'ID пользователя' })
    @ApiResponse({
      status: 200,
      description: 'Список транзакций пользователя',
    })
    async findUserTransactions(@Query('userId') userId: string, @Req() req: Request): Promise<Transaction[]> {
        let parsedUserId = parseInt(userId)
        if(!userId) {
            parsedUserId = req["user"].id
        }
      return this.transactionService.findUserTransactions(parsedUserId);
    }

	@Get(':id')
	async findOne(@Param('id') id: string): Promise<Transaction> {
        const transactionId = parseInt(id)
		return this.transactionService.findOne(transactionId)
	}

	@Put(':id')
	async update(
		@Param('id') id: string,
		@Body() updateTransactionDto: UpdateTransactionDto
	): Promise<Transaction> {
        const transactionId = parseInt(id)

		return this.transactionService.update(transactionId, updateTransactionDto)
	}

	@Delete(':id')
	async delete(@Param('id') id: string): Promise<Transaction> {
        const transactionId = parseInt(id)

		return this.transactionService.delete(transactionId)
	}
}
