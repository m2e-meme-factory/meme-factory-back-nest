import { ApiProperty, PartialType } from '@nestjs/swagger'
import { ProjectStatus } from '@prisma/client'
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator'

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
	@IsNumber()
	price: number
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

	@ApiProperty({ example: 1000 })
	@IsNumber()
	price: number
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class UpdateProjectStatusDto {
	@ApiProperty({ enum: ProjectStatus })
	status: ProjectStatus;
  }