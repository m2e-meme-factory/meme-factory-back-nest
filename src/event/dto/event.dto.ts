import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator'
import { EventType, UserRole } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'

export class CreateEventDto {
	@ApiProperty({ example: 1, description: 'ID of the project' })
	@IsInt()
	projectId: number

	@ApiProperty({ example: 1, description: 'ID of the user' })
	@IsInt()
	userId: number

	@ApiProperty({
		example: 'creator',
		enum: UserRole,
		description: 'Role of the user in the event'
	})
	@IsEnum(UserRole)
	role: UserRole

	@ApiProperty({
		example: 'APPLICATION_APPROVED',
		enum: EventType,
		description: 'Type of the event'
	})
	@IsEnum(EventType)
	eventType: EventType

	@ApiProperty({
		example: 'Application has been approved',
		description: 'Description of the event',
		required: false
	})
	@IsString()
	@IsOptional()
	description?: string

	@ApiProperty({
		example: { transactionId: 123, amount: 500 },
		description: 'Additional event details',
		required: false
	})
	@IsOptional()
	details?: Record<string, any>

	@IsInt()
	progressProjectId: number
}
