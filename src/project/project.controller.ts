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
	InternalServerErrorException,
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
import { ProjectService } from './project.service'
import {
	CreateProjectDto,
	UpdateProjectDto,
	UpdateProjectStatusDto
} from './dto/project.dto'
import { ProgressStatus, Project, User } from '@prisma/client'
import { PublicRoute } from 'src/auth/decorators/public-route.decorator'
import { IdValidationPipe } from 'src/pipes/id.validation.pipe'
import { ProjectProgressService } from './project-progress.service'
import { TaskProgressService } from './task-progress.service'

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
	@UsePipes(new ValidationPipe())
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
	@PublicRoute()
	async getProjectById(
		@Param('id', IdValidationPipe) id: number
	): Promise<Project | null> {
		return this.projectService.getProjectById(id)
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
		name: 'category',
		required: false,
		type: String,
		example: 'Category Name'
	})
	@ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
	@ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
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

	// @Post(':eventId/confirm-application')
	// @ApiOperation({ summary: 'Подтвердить или отклонить заявку на проект' })
	// @ApiParam({ name: 'projectId', description: 'ID проекта', type: 'number' })
	// @ApiBody({
	// 	schema: {
	// 		type: 'object',
	// 		properties: {
	// 			isApproved: {
	// 				type: 'boolean',
	// 				description: 'Подтверждена ли заявка'
	// 			}
	// 		},
	// 		required: ['isApproved']
	// 	}
	// })
	// @ApiResponse({
	// 	status: 200,
	// 	description: 'Заявка успешно подтверждена/отклонена'
	// })
	// @ApiResponse({ status: 500, description: 'Ошибка при подтверждении заявки' })
	// async confirmProjectApplication(
	// 	@Req() req: Request,
	// 	@Param('eventId', IdValidationPipe) eventId: number,
	// 	@Body('isApproved') isApproved: boolean
	// ): Promise<void> {
	// 	const user = req['user']
	// 	await this.projectService.confirmProjectApplication(
	// 		user,
	// 		eventId,
	// 		isApproved
	// 	)
	// }

	@ApiOperation({ summary: 'Получить прогресс проекта по ID проекта' })
	@ApiParam({ name: 'projectId', type: 'number', description: 'ID проекта' })
	@ApiResponse({
		status: 200,
		description: 'Успешное получение прогресса проекта'
	})
	@ApiResponse({ status: 401, description: 'Неавторизован' })
	@Get('progress/by-project/:projectId')
	async getAllProjectProgressByProjectId(
		@Param('projectId', IdValidationPipe) projectId: number,
		@Query('creatorId') creatorId: string,
		@Req() req: Request
	) {
		const user = req['user']
		return this.projectProgressService.getAllProjectProgressByProjectId(
			user,
			projectId,
			Number(creatorId)
		)
	}

	@ApiOperation({ summary: 'Подать заявку на участие в проекте' })
	@ApiParam({ name: 'id', type: 'string', description: 'ID проекта' })
	@ApiResponse({ status: 201, description: 'Заявка подана успешно' })
	@ApiResponse({ status: 401, description: 'Неавторизован' })
	@Post(':id/apply')
	async applyToProject(
		@Param('id') projectId: string,
		@Req() req: Request,
		@Body('message') message: string = ''
	) {
		const user = req['user']
		return this.projectProgressService.applyToProject(
			user,
			Number(projectId),
			message
		)
	}

	@ApiOperation({ summary: 'Получить события прогресса проекта по ID' })
	@ApiParam({
		name: 'progressProjectId',
		type: 'string',
		description: 'ID прогресса проекта'
	})
	@ApiResponse({
		status: 200,
		description: 'События прогресса проекта успешно получены'
	})
	@ApiResponse({ status: 404, description: 'Прогресс проекта не найден' })
	@Get('/progress/:progressProjectId/events')
	async getProjectProgressEvents(
		@Param('progressProjectId', IdValidationPipe) progressProjectId: number,
		@Query('page') page: string = '1',
		@Query('limit') limit: string = '10'
	) {
		return this.projectProgressService.getProjectProgressEvents(
			progressProjectId,
			Number(page),
			Number(limit)
		)
	}

	@ApiOperation({ summary: 'Принять заявку на участие в проекте' })
	@ApiParam({ name: 'id', type: 'number', description: 'ID прогресса проекта' })
	@ApiResponse({ status: 200, description: 'Заявка принята успешно' })
	@ApiResponse({ status: 401, description: 'Неавторизован' })
	@Post('progress/:id/accept')
	async acceptApplication(
		@Param('id') id: number,
		@Req() req: Request,
		@Body('message') message?: string
	) {
		const user = req['user']
		return this.projectProgressService.updateProjectProgressStatus(
			user,
			Number(id),
			ProgressStatus.accepted,
			message
		)
	}

	@ApiOperation({ summary: 'Отклонить заявку на участие в проекте' })
	@ApiParam({ name: 'id', type: 'number', description: 'ID прогресса проекта' })
	@ApiResponse({ status: 200, description: 'Заявка отклонена успешно' })
	@ApiResponse({ status: 401, description: 'Неавторизован' })
	@Post('progress/:id/reject')
	async rejectApplication(
		@Param('id') id: number,
		@Req() req: Request,
		@Body('message') message?: string
	) {
		const user = req['user']
		return this.projectProgressService.updateProjectProgressStatus(
			user,
			Number(id),
			ProgressStatus.rejected,
			message
		)
	}

	@Get('progress/by-creator/:creatorId')
	async getAllProjectByCreatorId(
		@Param('creatorId', IdValidationPipe) creatorId: number
	) {
		return this.projectProgressService.getAllProjectByCreatorId(creatorId)
	}

	@Get(':projectId/freelancers')
	async getAllCreatorsByProjectId(
		@Param('projectId', IdValidationPipe) projectId: number,
		@Query('status') status: ProgressStatus
	) {
		return this.projectProgressService.getAllCreatorsByProjectId(
			projectId,
			status
		)
	}

	// task progress start

	@Post(':projectId/task/:taskId/apply-completion')
	async applyToCompleteTask(
		@Param('projectId', IdValidationPipe) projectId: number,
		@Param('taskId', IdValidationPipe) taskId: number,
		@Req() req: Request,
		@Body('message') message?: string
	) {
		const user = req['user']
		return this.taskProgressService.applyToCompleteTask(
			user,
			projectId,
			taskId,
			message
		)
	}

	@Post(':projectId/task/:taskId/approve-completion')
	async approveTaskCompletion(
		@Param('projectId', IdValidationPipe) projectId: number,
		@Param('taskId', IdValidationPipe) taskId: number,
		@Req() req: Request,
		@Body('creatorId') creatorId: number,
		@Body('message') message?: string,
	) {
		const user = req['user']
		return this.taskProgressService.approveTaskCompletion(
			user,
			projectId,
			taskId,
			creatorId,
			message
		)
	}

	// task progress end
}
