import { Controller, Query, Req } from '@nestjs/common'
import { Body, Delete, Get, Param, Post, Put } from '@nestjs/common'
import {
	CreateTransactionDto,
	UpdateTransactionDto
} from './dto/transaction.dto'
import { TransactionService } from './transaction.service'
import {
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags,
	ApiParam,
	ApiBody
} from '@nestjs/swagger'
import { Decimal } from '@prisma/client/runtime/library'

@ApiTags('transactions')
@Controller('transactions')
export class TransactionController {
	constructor(private readonly transactionService: TransactionService) {}

	@Post()
	@ApiOperation({ summary: 'Создать новую транзакцию' })
	@ApiBody({ type: CreateTransactionDto })
	@ApiResponse({
		status: 201,
		description: 'Транзакция успешно создана',
		schema: {
			type: 'object',
			properties: {
				transaction: {
					type: 'object',
					properties: {
						id: { type: 'number', example: 1 },
						projectId: { type: 'number', example: 1 },
						taskId: { type: 'number', example: 1 },
						fromUserId: { type: 'number', example: 1 },
						toUserId: { type: 'number', example: 2 },
						amount: { type: 'number', example: 100.0 },
						createdAt: {
							type: 'string',
							format: 'date-time',
							example: '2024-08-16T20:01:22.146Z'
						}
					}
				},
				newBalance: { type: 'number', format: 'decimal', example: '100.50' }
			}
		}
	})
	async create(
		@Body() createTransactionDto: CreateTransactionDto
	): Promise<{ transaction: any; newBalance: Decimal }> {
		return this.transactionService.createTransaction(createTransactionDto)
	}

	@Get()
	@ApiOperation({ summary: 'Получить список всех транзакций' })
	@ApiResponse({
		status: 200,
		description: 'Список всех транзакций',
		schema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'number', example: 1 },
					projectId: { type: 'number', example: 1 },
					taskId: { type: 'number', example: 1 },
					fromUserId: { type: 'number', example: 1 },
					toUserId: { type: 'number', example: 2 },
					amount: { type: 'number', example: 100.0 },
					createdAt: {
						type: 'string',
						format: 'date-time',
						example: '2024-08-16T20:01:22.146Z'
					}
				}
			}
		}
	})
	async findAll(): Promise<any[]> {
		return this.transactionService.findAll()
	}

	@Get('by-user')
	@ApiOperation({ summary: 'Получить историю транзакций пользователя' })
	@ApiQuery({
		name: 'userId',
		type: Number,
		required: true,
		description: 'ID пользователя'
	})
	@ApiResponse({
		status: 200,
		description: 'Список транзакций пользователя',
		schema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'number', example: 1 },
					projectId: { type: 'number', example: 1 },
					taskId: { type: 'number', example: 1 },
					fromUserId: { type: 'number', example: 1 },
					toUserId: { type: 'number', example: 2 },
					amount: { type: 'number', example: 100.0 },
					createdAt: {
						type: 'string',
						format: 'date-time',
						example: '2024-08-16T20:01:22.146Z'
					}
				}
			}
		}
	})
	async findUserTransactions(
		@Query('userId') userId: string,
		@Req() req: Request
	): Promise<any[]> {
		let parsedUserId = parseInt(userId)
		if (!userId) {
			parsedUserId = req['user'].id
		}
		return this.transactionService.findUserTransactions(parsedUserId)
	}

	@Get(':id')
	@ApiOperation({ summary: 'Получить информацию о транзакции по ID' })
	@ApiParam({ name: 'id', type: Number, description: 'ID транзакции' })
	@ApiResponse({
		status: 200,
		description: 'Данные о транзакции',
		schema: {
			type: 'object',
			properties: {
				id: { type: 'number', example: 1 },
				projectId: { type: 'number', example: 1 },
				taskId: { type: 'number', example: 1 },
				fromUserId: { type: 'number', example: 1 },
				toUserId: { type: 'number', example: 2 },
				amount: { type: 'number', example: 100.0 },
				createdAt: {
					type: 'string',
					format: 'date-time',
					example: '2024-08-16T20:01:22.146Z'
				}
			}
		}
	})
	async findOne(@Param('id') id: string): Promise<any> {
		const transactionId = parseInt(id)
		return this.transactionService.findOne(transactionId)
	}

	@Put(':id')
	@ApiOperation({ summary: 'Обновить информацию о транзакции по ID' })
	@ApiParam({ name: 'id', type: Number, description: 'ID транзакции' })
	@ApiBody({ type: UpdateTransactionDto })
	@ApiResponse({
		status: 200,
		description: 'Транзакция успешно обновлена',
		schema: {
			type: 'object',
			properties: {
				id: { type: 'number', example: 1 },
				projectId: { type: 'number', example: 1 },
				taskId: { type: 'number', example: 1 },
				fromUserId: { type: 'number', example: 1 },
				toUserId: { type: 'number', example: 2 },
				amount: { type: 'number', example: 100.0 },
				createdAt: {
					type: 'string',
					format: 'date-time',
					example: '2024-08-16T20:01:22.146Z'
				}
			}
		}
	})
	async update(
		@Param('id') id: string,
		@Body() updateTransactionDto: UpdateTransactionDto
	): Promise<any> {
		const transactionId = parseInt(id)
		return this.transactionService.update(transactionId, updateTransactionDto)
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Удалить транзакцию по ID' })
	@ApiParam({ name: 'id', type: Number, description: 'ID транзакции' })
	@ApiResponse({
		status: 200,
		description: 'Транзакция успешно удалена',
		schema: {
			type: 'object',
			properties: {
				id: { type: 'number', example: 1 },
				projectId: { type: 'number', example: 1 },
				taskId: { type: 'number', example: 1 },
				fromUserId: { type: 'number', example: 1 },
				toUserId: { type: 'number', example: 2 },
				amount: { type: 'number', example: 100.0 },
				createdAt: {
					type: 'string',
					format: 'date-time',
					example: '2024-08-16T20:01:22.146Z'
				}
			}
		}
	})
	async delete(@Param('id') id: string): Promise<any> {
		const transactionId = parseInt(id)
		return this.transactionService.delete(transactionId)
	}
}
