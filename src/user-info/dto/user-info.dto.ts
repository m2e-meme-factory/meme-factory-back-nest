import { ApiProperty } from "@nestjs/swagger"
import { IsOptional, IsString } from "class-validator"

export class UpdateUserInfoDto {
	@IsString()
	@IsOptional()
  @ApiProperty({required: false})
	name?: string
  @ApiProperty({required: false})
	@IsString()
	@IsOptional()
	phoneNumber?: string
  @ApiProperty({required: false})
	@IsString()
	@IsOptional()
	email?: string
  @ApiProperty({required: false})
	@IsString()
	@IsOptional()
	tonWalletAddress?: string
}
