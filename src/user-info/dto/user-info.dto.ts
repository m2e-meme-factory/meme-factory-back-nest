import { ApiProperty } from "@nestjs/swagger"
import { IsOptional, IsString } from "class-validator"

export class UpdateUserInfoDto {
	@IsString()
	@IsOptional()
  @ApiProperty()
	name?: string
  @ApiProperty()
	@IsString()
	@IsOptional()
	phoneNumber?: string
  @ApiProperty()
	@IsString()
	@IsOptional()
	email?: string
  @ApiProperty()
	@IsString()
	@IsOptional()
	tonWalletAddress?: string
}
