import { ApiProperty } from '@nestjs/swagger'
import { Decimal } from '@prisma/client/runtime/library'
import { IsInt, IsNotEmpty, IsOptional, IsDecimal } from 'class-validator'

export class CreateTransactionDto {
	@ApiProperty()
	@IsInt()
	@IsNotEmpty()
	projectId: number

	@ApiProperty()
	@IsInt()
	@IsNotEmpty()
	taskId: number

	@ApiProperty()
	@IsInt()
	@IsNotEmpty()
	fromUserId: number

	@ApiProperty()
	@IsInt()
	@IsNotEmpty()
	toUserId: number

	@ApiProperty()
	@IsDecimal()
	@IsNotEmpty()
	amount: Decimal

	@ApiProperty()
	@IsOptional()
	@IsNotEmpty()
	createdAt?: Date
}

export class UpdateTransactionDto {
	@ApiProperty()
	@IsOptional()
	@IsInt()
	projectId?: number

	@ApiProperty()
	@IsOptional()
	@IsInt()
	taskId?: number

	@ApiProperty()
	@IsOptional()
	@IsInt()
	fromUserId?: number

	@ApiProperty()
	@IsOptional()
	@IsInt()
	toUserId?: number

	@ApiProperty()
	@IsOptional()
	@IsDecimal()
	amount?: Decimal

	@ApiProperty()
	@IsOptional()
	createdAt?: Date
}
