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
	ValidationPipe,
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
import { ProjectService } from '../services/project.service'
import {
	CreateProjectDto,
	UpdateProjectDto,
	UpdateProjectStatusDto
} from '../dto/project.dto'
import { ProgressStatus, Project, ProjectStatus, User } from '@prisma/client'
import { PublicRoute } from 'src/auth/decorators/public-route.decorator'
import { IdValidationPipe } from 'src/pipes/id.validation.pipe'
import { ProjectProgressService } from '../services/project-progress.service'
import { TaskProgressService } from '../services/task-progress.service'
import { Decimal } from '@prisma/client/runtime/library'
import { IProjectResponse } from '../types/project.types'
import { NotificationService } from 'src/notification/notification.service'
import { UserService } from 'src/user/user.service'
@ApiTags('projects')
@ApiBearerAuth('access-token')
@Controller('projects')
export class ProjectController {
	constructor(
		private readonly projectService: ProjectService,
		private readonly projectProgressService: ProjectProgressService,
		private readonly taskProgressService: TaskProgressService,
		private readonly notificationService: NotificationService,
		private readonly userService: UserService
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
		const project = await this.projectService.createProject(createProjectDto, user)

		await this.notificationService.create({
			userId: user.telegramId,
			message: `Quest "${project.title}" successfully created.`
		})

		return project
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
	): Promise<IProjectResponse | null> {
		return this.projectService.getProjectById(id)
	}

	@Get()
	@ApiOperation({
		summary: 'Получить все проекты с фильтрацией, пагинацией и сортировкой'
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
	@ApiQuery({
		name: 'sortBy',
		required: false,
		enum: ['price', 'id'],
		example: 'price'
	})
	@ApiQuery({
		name: 'sortOrder',
		required: false,
		enum: ['asc', 'desc'],
		example: 'desc'
	})
	@ApiResponse({
		status: 200,
		description: 'Список проектов.',
		schema: {
			example: {
				projects: [
					{
						project: {
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
										description: 'example description',
										price: 10
									}
								}
							]
						},
						minPrice: 10,
						maxPrice: 100,
						totalPrice: 110
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
		@Query('limit') limit: string = '10',
		@Query('sortBy') sortBy: 'price' | 'id' = 'id',
		@Query('sortOrder') sortOrder: 'asc' | 'desc' = 'desc'
	): Promise<{ projects: IProjectResponse[]; total: number }> {
		const parsedPage = parseInt(page)
		const parsedLimit = parseInt(limit)
		const tagsArray = Array.isArray(tags) ? tags : tags ? [tags] : []

		return this.projectService.getAllProjects(
			tagsArray,
			category,
			parsedPage,
			parsedLimit,
			sortBy,
			sortOrder
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
	): Promise<{ projects: IProjectResponse[]; total: number }> {
		return this.projectService.getAllProjectsByUserId(
			userId,
			Number(page),
			Number(limit)
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

	@ApiOperation({ summary: 'Подать заявку на участие в проекте' })
	@ApiParam({ name: 'id', type: 'string', description: 'ID проекта' })
	@ApiResponse({
		status: 201,
		description: 'Заявка подана успешно',
		schema: {
			example: {
				id: 20,
				userId: 7,
				projectId: 20,
				status: 'pending',
				createdAt: '2024-08-16T20:01:22.146Z',
				updatedAt: '2024-08-16T20:01:22.146Z'
			}
		}
	})
	@ApiResponse({ status: 401, description: 'Неавторизован' })
	@Post(':id/apply')
	async applyToProject(
		@Param('id') projectId: string,
		@Req() req: Request,
		@Body('message') message: string = ''
	) {
		const user = req['user']
		const result = await this.projectProgressService.applyToProject(
			user,
			Number(projectId),
			message
		)
		const project = await this.projectService.getProjectById(Number(projectId))
		const author = await this.userService.getUserById(project.project.authorId)
		await this.notificationService.create({
			userId: author.telegramId,
			message: `New join request in "${project.project.title}" from user: ${user.username ? `@${user.username}` : user.id}.`
		})

		return result
	}

	@Get(':projectId/cost')
	@ApiOperation({ summary: 'Получить общие затраты на проект' })
	@ApiParam({ name: 'projectId', type: Number, description: 'ID проекта' })
	@ApiResponse({
		status: 200,
		description: 'Общие затраты на проект успешно получены.',
		schema: {
			example: 15000
		}
	})
	@ApiResponse({
		status: 404,
		description: 'Проект не найден.'
	})
	@ApiResponse({
		status: 500,
		description: 'Ошибка при вычислении затрат на проект.'
	})
	async calculateTotalProjectCost(
		@Req() req: Request,
		@Param('projectId', IdValidationPipe) projectId: number
	): Promise<number> {
		const user = req['user']
		return await this.projectService.calculateTotalProjectCost(user, projectId)
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
	): Promise<{ project: Project; minPrice: Decimal; maxPrice: Decimal }> {
		const projectId = parseInt(id)
		const user: User = req['user']
		const result = await this.projectService.updateProject(projectId, updateProjectDto, user)

		await this.notificationService.create({
			userId: user.telegramId,
			message: `Quest "${result.project.title}" successfully updated.`
		})

		return result
	}

	@Get(':projectId/freelancers')
	@ApiResponse({
		status: 200,
		description: 'Данные о фрилансерах успешно получены',
		schema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					user: {
						type: 'object',
						properties: {
							id: { type: 'number', example: 7 },
							telegramId: { type: 'string', example: '631855340' },
							username: { type: 'string', nullable: true, example: null },
							isBaned: { type: 'boolean', example: false },
							isVerified: { type: 'boolean', example: false },
							createdAt: {
								type: 'string',
								format: 'date-time',
								example: '2024-08-09T15:17:13.451Z'
							},
							inviterRefCode: {
								type: 'string',
								nullable: true,
								example: null
							},
							refCode: {
								type: 'string',
								example: 'cd3b7d08-594e-427e-9545-8daeb15ddeb4'
							},
							role: { type: 'string', example: 'advertiser' },
							balance: { type: 'string', example: '10' }
						}
					},
					progress: {
						type: 'object',
						properties: {
							id: { type: 'number', example: 20 },
							projectId: { type: 'number', example: 20 },
							status: { type: 'string', example: 'accepted' },
							createdAt: {
								type: 'string',
								format: 'date-time',
								example: '2024-08-16T20:01:22.146Z'
							},
							updatedAt: {
								type: 'string',
								format: 'date-time',
								example: '2024-08-16T20:10:33.159Z'
							}
						}
					}
				}
			}
		}
	})
	@PublicRoute()
	async getAllCreatorsByProjectId(
		@Param('projectId', IdValidationPipe) projectId: number,
		@Query('status') status: ProgressStatus
	) {
		return this.projectProgressService.getAllCreatorsByProjectId(
			projectId,
			status
		)
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
	): Promise<IProjectResponse> {
		const projectId = parseInt(id)
		const user: User = req['user']
		const result = await this.projectService.updateProjectStatus(
			projectId,
			updateProjectStatusDto.status,
			user
		)

		await this.notificationService.create({
			userId: user.telegramId,
			message: `Quest status "${result.project.title}" was updated to: ${updateProjectStatusDto.status}.`
		})

		return result
	}
}
