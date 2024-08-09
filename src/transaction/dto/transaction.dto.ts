import { ApiProperty } from '@nestjs/swagger'
import { IsInt, IsNumber, IsNotEmpty, IsOptional } from 'class-validator'

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
	@IsNumber()
	@IsNotEmpty()
	amount: number

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
	@IsNumber()
	amount?: number

	@ApiProperty()
	@IsOptional()
	createdAt?: Date
}
