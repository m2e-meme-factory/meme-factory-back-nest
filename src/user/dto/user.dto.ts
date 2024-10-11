import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Decimal } from '@prisma/client/runtime/library'

export class CreateUserDto {
	@ApiProperty()
	@IsString()
	telegramId: string

	@ApiProperty()
	@IsString()
	username: string

	@ApiProperty()
	@IsBoolean()
	@IsOptional()
	isBaned?: boolean

	@ApiProperty()
	@IsBoolean()
	@IsOptional()
	isVerified?: boolean

	@ApiProperty()
	@IsString()
	@IsOptional()
	inviterRefCode?: string
	
	@ApiProperty()
	@IsString()
	@IsOptional()
	refCode?: string
}

export class VerifyUserDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	telegramId: string
}

export class IsUserVerifiedDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	userId: string
}

export class GetReferalsCountDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	refId: string
}

export class GetUserDataDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	userId: string
}


export class UpdateUserBalanceDto {
	@ApiProperty()
	balance: Decimal;
  }