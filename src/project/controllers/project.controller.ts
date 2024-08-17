import {
	Controller,
	Get,
	Post,
	Put,
	Body,
	Param,
	Req,
	Query,
	UsePipes,
	ValidationPipe
} from '@nestjs/common'
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiParam,
	ApiBody,
	ApiBearerAuth,
	ApiQuery
} from '@nestjs/swagger'
import { ProjectService } from '../services/project.service'
import {
	CreateProjectDto,
	UpdateProjectDto,
	UpdateProjectStatusDto
} from '../dto/project.dto'
import { Project, ProjectStatus, User } from '@prisma/client'
import { PublicRoute } from 'src/auth/decorators/public-route.decorator'
import { IdValidationPipe } from 'src/pipes/id.validation.pipe'
import { ProjectProgressService } from '../services/project-progress.service'
import { TaskProgressService } from '../services/task-progress.service'

@ApiTags('projects')
@ApiBearerAuth('access-token')
@Controller('projects')
export class ProjectController {
	constructor(
		private readonly projectService: ProjectService,
		private readonly projectProgressService: ProjectProgressService,
		private readonly taskProgressService: TaskProgressService
	) {}

	@Post()
	@ApiOperation({ summary: 'Создать проект' })
	@ApiBody({ type: CreateProjectDto })
	@ApiResponse({
		status: 201,
		description: 'Проект успешно создан.',
		schema: {
			example: {
				id: 1,
				authorId: 1,
				title: 'Example Project',
				description: 'Description of the example project',
				bannerUrl: 'http://example.com/banner.png',
				files: ['file1.png', 'file2.png'],
				tags: ['tag1', 'tag2'],
				category: 'Category Name',
				price: 1000,
				status: ProjectStatus.draft
			}
		}
	})
	@ApiResponse({ status: 400, description: 'Неверные данные запроса.' })
	async createProject(
		@Body() createProjectDto: CreateProjectDto,
		@Req() req: Request
	): Promise<Project> {
		const user: User = req['user']
		return this.projectService.createProject(createProjectDto, user)
	}

	@Get(':id')
	@UsePipes(new ValidationPipe())
	@ApiOperation({ summary: 'Получить проект по ID' })
	@ApiParam({ name: 'id', description: 'ID проекта' })
	@ApiResponse({
		status: 200,
		description: 'Проект найден.',
		schema: {
			example: {
				id: 20,
				authorId: 7,
				title: 'example for tasks',
				description: 'example',
				bannerUrl: 'example',
				files: ['uploads/file1.png', 'uploads/file2.png', 'uploads/file3.png'],
				tags: ['priority'],
				category: 'example category',
				price: 100,
				status: ProjectStatus.draft,
				tasks: [
					{
						projectId: 20,
						taskId: 19,
						task: {
							id: 19,
							title: 'example title of task for validation',
							description: 'example decription',
							price: 10
						}
					}
				]
			}
		}
	})
	@ApiResponse({ status: 404, description: 'Проект не найден.' })
	@PublicRoute()
	async getProjectById(
		@Param('id', IdValidationPipe) id: number
	): Promise<Project | null> {
		return this.projectService.getProjectById(id)
	}

	@Get()
	@ApiOperation({
		summary: 'Получить все проекты с фильтрацией и пагинацией'
	})
	@ApiQuery({
		name: 'tags',
		required: false,
		type: [String],
		example: ['tag1', 'tag2']
	})
	@ApiQuery({
		name: 'category',
		required: false,
		type: String,
		example: 'Category Name'
	})
	@ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
	@ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
	@ApiResponse({
		status: 200,
		description: 'Список проектов.',
		schema: {
			example: {
				projects: [
					{
						id: 20,
						authorId: 7,
						title: 'example for tasks',
						description: 'example',
						bannerUrl: 'example',
						files: [
							'uploads/file1.png',
							'uploads/file2.png',
							'uploads/file3.png'
						],
						tags: ['priority'],
						category: 'example category',
						price: 100,
						status: ProjectStatus.draft,
						tasks: [
							{
								projectId: 20,
								taskId: 19,
								task: {
									id: 19,
									title: 'example title of task for validation',
									description: 'example decription',
									price: 10
								}
							}
						]
					}
				],
				total: 1
			}
		}
	})
	@PublicRoute()
	async getAllProjects(
		@Query('tags') tags?: string[],
		@Query('category') category?: string,
		@Query('page') page: string = '1',
		@Query('limit') limit: string = '10'
	): Promise<{ projects: Project[]; total: number }> {
		const parsedPage = parseInt(page)
		const parsedLimit = parseInt(limit)
		const tagsArray = Array.isArray(tags) ? tags : tags ? [tags] : []

		return this.projectService.getAllProjects(
			tagsArray,
			category,
			parsedPage,
			parsedLimit
		)
	}

	@Get('by-user/:userId')
	@ApiOperation({
		summary: 'Получить все проекты пользователя по userId с пагинацией'
	})
	@ApiParam({ name: 'userId', description: 'ID пользователя' })
	@ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
	@ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
	@ApiResponse({
		status: 200,
		description: 'Список проектов пользователя с пагинацией.',
		schema: {
			example: {
				projects: [
					{
						id: 20,
						authorId: 7,
						title: 'example for tasks',
						description: 'example',
						bannerUrl: 'example',
						files: [
							'uploads/file1.png',
							'uploads/file2.png',
							'uploads/file3.png'
						],
						tags: ['priority'],
						category: 'example category',
						price: 100,
						status: ProjectStatus.draft,
						tasks: [
							{
								projectId: 20,
								taskId: 19,
								task: {
									id: 19,
									title: 'example title of task for validation',
									description: 'example decription',
									price: 10
								}
							}
						]
					}
				],
				total: 1
			}
		}
	})
	@ApiResponse({ status: 404, description: 'Проекты не найдены.' })
	@PublicRoute()
	async getAllProjectsByUserId(
		@Param('userId', IdValidationPipe) userId: number,
		@Query('page') page: number = 1,
		@Query('limit') limit: number = 10
	): Promise<{ projects: Project[]; total: number }> {
		return this.projectService.getAllProjectsByUserId(
			userId,
			Number(page),
			Number(limit)
		)
	}

	@Put(':id')
	@ApiOperation({ summary: 'Обновить проект' })
	@ApiParam({ name: 'id', description: 'ID проекта' })
	@ApiBody({ type: UpdateProjectDto })
	@ApiResponse({
		status: 200,
		description: 'Проект успешно обновлен.',
		schema: {
			example: {
				id: 1,
				authorId: 1,
				title: 'Updated Project',
				description: 'Updated description of the project',
				bannerUrl: 'http://example.com/banner_updated.png',
				files: ['file1.png', 'file2.png'],
				tags: ['updatedTag1', 'updatedTag2'],
				category: 'Updated Category Name',
				price: 2000,
				tasks: [
					{
						projectId: 20,
						taskId: 19,
						task: {
							id: 19,
							title: 'example title of task for validation',
							description: 'example decription',
							price: 10
						}
					}
				]
			}
		}
	})
	@ApiResponse({ status: 400, description: 'Неверные данные запроса.' })
	@ApiResponse({ status: 404, description: 'Проект не найден.' })
	async updateProject(
		@Param('id') id: string,
		@Body() updateProjectDto: UpdateProjectDto,
		@Req() req: Request
	): Promise<Project> {
		const projectId = parseInt(id)
		const user: User = req['user']
		return this.projectService.updateProject(projectId, updateProjectDto, user)
	}

	@Put(':id/status')
	@ApiOperation({ summary: 'Обновить статус проекта' })
	@ApiParam({ name: 'id', description: 'ID проекта' })
	@ApiBody({ type: UpdateProjectStatusDto })
	@ApiResponse({
		status: 200,
		description: 'Статус проекта успешно обновлен.',
		schema: {
			example: {
				id: 1,
				status: ProjectStatus.published
			}
		}
	})
	@ApiResponse({ status: 400, description: 'Неверные данные запроса.' })
	@ApiResponse({ status: 404, description: 'Проект не найден.' })
	async updateProjectStatus(
		@Param('id') id: string,
		@Body() updateProjectStatusDto: UpdateProjectStatusDto,
		@Req() req: Request
	): Promise<Project> {
		const projectId = parseInt(id)
		const user: User = req['user']
		return this.projectService.updateProjectStatus(
			projectId,
			updateProjectStatusDto.status,
			user
		)
	}
}
