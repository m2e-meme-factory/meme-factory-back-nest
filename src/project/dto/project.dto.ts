import { ApiProperty, PartialType } from '@nestjs/swagger'
import { ProjectStatus } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import {
	IsArray,
	IsDecimal,
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString
} from 'class-validator'

export class CreateTaskDto {
	@IsOptional()
	@IsNumber()
	id?: number

	@ApiProperty({ example: 'example title for task' })
	@IsString()
	title: string

	@ApiProperty({ example: 'example description for task' })
	@IsString()
	description: string

	@ApiProperty({ example: 1000 })
	@IsDecimal()
	price: Decimal
}

export class CreateProjectDto {
	@ApiProperty({ example: 1 })
	@IsNumber()
	authorId: number

	@ApiProperty({ example: 'Example Project' })
	@IsString()
	title: string

	@ApiProperty({ example: 'Description of the example project' })
	@IsString()
	description: string

	@ApiProperty({ example: 'http://example.com/banner.png' })
	@IsString()
	@IsOptional()
	bannerUrl?: string

	@ApiProperty({ example: ['file1.png', 'file2.png'] })
	@IsArray()
	@IsOptional()
	@IsString({ each: true })
	files?: string[]

	@ApiProperty({ example: ['tag1', 'tag2'] })
	@IsArray()
	@IsString({ each: true })
	tags: string[]

	@ApiProperty({ example: 'Category Name' })
	@IsString()
	category: string

	@ApiProperty({
		type: [CreateTaskDto]
	})
	@IsArray()
	subtasks: CreateTaskDto[]
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
	@IsArray()
	@ApiProperty({ example: [1, 2, 3, 4, 5] })
	@IsOptional()
	deletedTasks?: number[]
}

export class UpdateProjectStatusDto {
	@ApiProperty({ enum: ProjectStatus })
	status: ProjectStatus


}
// export class UpdateProjectApplicationStatusDto {
// 	@ApiProperty({ enum: ApplicationStatus })
// 	status: ApplicationStatus
// }

// export class UpdateTaskResponseStatusDto {
// 	@ApiProperty({ enum: ResponseStatus })
// 	status: ResponseStatus
// }

export class ApplyProjectDto {
	@IsInt()
	@IsNotEmpty()
	@ApiProperty({ example: 1 })
	projectId: number
}

export class RespondTaskDto {
	@IsInt()
	@IsNotEmpty()
	@ApiProperty({ example: 1 })
	taskId: number
}

export class RejectTaskCompletionDto {
	@ApiProperty({
		description: 'ID пользователя, создавшего задачу',
		example: 1
	})
	@IsNumber()
	creatorId: number
	@ApiProperty({
		description: 'ID события, которое принимаем',
		example: 1
	})
	@IsNumber()
	eventId: number

	@ApiProperty({
		description: 'Сообщение с причиной отклонения',
		example: 'Задача выполнена неверно.',
		required: false
	})
	@IsString()
	message?: string
}
