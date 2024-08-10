import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Param,
	Req,
	Query,
	InternalServerErrorException
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
import { ProjectService } from './project.service'
import {
	CreateProjectDto,
	UpdateProjectApplicationStatusDto,
	UpdateProjectDto,
	UpdateProjectStatusDto,
	UpdateTaskResponseStatusDto
} from './dto/project.dto'
import { Application, Project, TaskResponse, User } from '@prisma/client'
import { PublicRoute } from 'src/auth/decorators/public-route.decorator'

@ApiTags('projects')
@ApiBearerAuth('access-token')
@Controller('projects')
export class ProjectController {
	constructor(private readonly projectService: ProjectService) {}

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
				tasks: [
					{
						id: 1,
						title: 'Task 1',
						description: 'Description of task 1',
						price: 500
					},
					{
						id: 2,
						title: 'Task 2',
						description: 'Description of task 2',
						price: 500
					}
				]
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
	@ApiOperation({ summary: 'Получить проект по ID' })
	@ApiParam({ name: 'id', description: 'ID проекта' })
	@ApiResponse({
		status: 200,
		description: 'Проект найден.',
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
				tasks: [
					{
						id: 1,
						title: 'Task 1',
						description: 'Description of task 1',
						price: 500
					},
					{
						id: 2,
						title: 'Task 2',
						description: 'Description of task 2',
						price: 500
					}
				]
			}
		}
	})
	@ApiResponse({ status: 404, description: 'Проект не найден.' })
	async getProjectById(@Param('id') id: string): Promise<Project | null> {
		const projectId = parseInt(id)
		return this.projectService.getProjectById(projectId)
	}

	@Get()
	@ApiOperation({ summary: 'Получить все проекты с фильтрацией и пагинацией' })
	@ApiResponse({
		status: 200,
		description: 'Список проектов.',
		schema: {
			example: {
				projects: [
					{
						id: 1,
						authorId: 1,
						title: 'Example Project',
						description: 'Description of the example project',
						bannerUrl: 'http://example.com/banner.png',
						files: ['file1.png', 'file2.png'],
						tags: ['tag1', 'tag2'],
						category: 'Category Name',
						price: 1000,
						tasks: [
							{
								id: 1,
								title: 'Task 1',
								description: 'Description of task 1',
								price: 500
							},
							{
								id: 2,
								title: 'Task 2',
								description: 'Description of task 2',
								price: 500
							}
						]
					}
				],
				total: 1
			}
		}
	})
	@ApiQuery({
		name: 'tags',
		required: false,
		type: [String],
		example: ['tag1', 'tag2']
	})
	@ApiQuery({
		name: 'categories',
		required: false,
		type: [String],
		example: ['Category Name']
	})
	@ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
	@ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
	@PublicRoute()
	async getAllProjects(
		@Query('tags') tags?: string[],
		@Query('category') category?: string,
		@Query('page') page: number = 1,
		@Query('limit') limit: number = 10
	): Promise<{ projects: Project[]; total: number }> {
		const tagsArray = Array.isArray(tags) ? tags : tags ? [tags] : []

		return this.projectService.getAllProjects(tagsArray, category, page, limit)
	}
	@Get('by-user/:userId')
	@ApiOperation({ summary: 'Получить все проекты пользователя по userId' })
	@ApiParam({ name: 'userId', description: 'ID пользователя' })
	@ApiResponse({
		status: 200,
		description: 'Список проектов пользователя.',
		schema: {
			example: [
				{
					id: 1,
					authorId: 1,
					title: 'Example Project',
					description: 'Description of the example project',
					bannerUrl: 'http://example.com/banner.png',
					files: ['file1.png', 'file2.png'],
					tags: ['tag1', 'tag2'],
					category: 'Category Name',
					price: 1000,
					tasks: [
						{
							id: 1,
							title: 'Task 1',
							description: 'Description of task 1',
							price: 500
						},
						{
							id: 2,
							title: 'Task 2',
							description: 'Description of task 2',
							price: 500
						}
					]
				}
			]
		}
	})
	@ApiResponse({ status: 404, description: 'Проекты не найдены.' })
	@PublicRoute()
	async getAllProjectsByUserId(
		@Param('userId') userId: string
	): Promise<Project[]> {
		const userIntId = parseInt(userId, 10)
		return this.projectService.getAllProjectsByUserId(userIntId)
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
						id: 1,
						title: 'Updated Task 1',
						description: 'Updated description of task 1',
						price: 1000
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
	@ApiOperation({ summary: 'Изменить статус проекта' })
	@ApiParam({ name: 'id', description: 'ID проекта' })
	@ApiBody({ type: UpdateProjectStatusDto })
	@ApiResponse({
		status: 200,
		description: 'Статус проекта успешно обновлен.',
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
				status: 'published'
			}
		}
	})
	@ApiResponse({ status: 400, description: 'Неверные данные запроса.' })
	@ApiResponse({ status: 404, description: 'Проект не найден.' })
	@ApiResponse({ status: 403, description: 'Доступ запрещен.' })
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

	@Delete(':id')
	@ApiOperation({ summary: 'Удалить проект' })
	@ApiParam({ name: 'id', description: 'ID проекта' })
	@ApiResponse({ status: 200, description: 'Проект успешно удален.' })
	@ApiResponse({ status: 404, description: 'Проект не найден.' })
	async deleteProject(@Param('id') id: string): Promise<Project> {
		const projectId = parseInt(id)
		return this.projectService.deleteProject(projectId)
	}

	@Post(':id/apply')
	async applyToProject(@Param('id') projectId: string, @Req() req: Request) {
		const user = req['user']
		const parsedProjectId = parseInt(projectId)
		return this.projectService.applyToProject(user.id, parsedProjectId)
	}

	@Post('tasks/:id/respond')
	async respondToTask(@Param('id') taskId: string, @Req() req: Request) {
		const user = req['user']
		const parsedTaskId = parseInt(taskId)
		return this.projectService.respondToTask(user.id, parsedTaskId)
	}

	@Put('application/:id/status')
	async updateProjectApplicationStatus(
		@Param('id') id: string,
		@Body()
		updateProjectApplicationStatusDto: UpdateProjectApplicationStatusDto,
		@Req() req: Request
	): Promise<Application> {
		const projectId = parseInt(id)
		const user: User = req['user']
		return this.projectService.updateProjectApplicationStatus(
			projectId,
			updateProjectApplicationStatusDto.status,
			user
		)
	}
	@Put('tasks/response/:id/status')
	async updateTaskResponseStatus(
		@Param('id') id: string,
		@Body() updateTaskResponseStatusDto: UpdateTaskResponseStatusDto,
		@Req() req: Request
	): Promise<TaskResponse> {
		const projectId = parseInt(id)
		const user: User = req['user']
		return this.projectService.updateTaskResponseStatus(
			projectId,
			updateTaskResponseStatusDto.status,
			user
		)
	}

	@Get(':id/files_tg/:tg_id')
	@ApiOperation({ summary: 'Send project files to Telegram user' })
	@ApiParam({ name: 'id', description: 'Project ID' })
	@ApiParam({ name: 'tg_id', description: 'Telegram user ID' })
	@ApiResponse({
		status: 200,
		description: 'Files sent to Telegram successfully.'
	})
	@ApiResponse({ status: 404, description: 'Project or files not found.' })
	@ApiResponse({ status: 500, description: 'Internal server error.' })
	@PublicRoute()
	async sendFilesToTelegram(
		@Param('id') projectId: string,
		@Param('tg_id') telegramId: string
	) {
		try {
			const parsedProjectId = parseInt(projectId)
			await this.projectService.sendProjectFilesToTelegram(
				parsedProjectId,
				telegramId
			)
			return { message: 'Файлы отправлены в Telegram' }
		} catch (error) {
			throw new InternalServerErrorException(
				`Ошибка при отправке файлов в Telegram: ${error}`,
				error.message
			)
		}
	}
}
