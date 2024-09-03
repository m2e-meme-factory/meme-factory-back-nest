import { ApiProperty } from '@nestjs/swagger'
import { TransactionType } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { IsInt, IsNotEmpty, IsOptional, IsDecimal, IsEnum } from 'class-validator'

export class CreateTransactionDto {
	@ApiProperty()
	@IsInt()
	@IsOptional()
	projectId?: number

	@ApiProperty()
	@IsInt()
	@IsNotEmpty()
	taskId: number

	@ApiProperty()
	// @IsInt()
	// @IsString()
	@IsOptional()
	fromUserId?: number

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

	@ApiProperty({ enum: TransactionType })
	@IsEnum(TransactionType)
	@IsNotEmpty()
	type: TransactionType
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

	@ApiProperty({ enum: TransactionType })
	@IsEnum(TransactionType)
	@IsOptional()
	type?: TransactionType
}
