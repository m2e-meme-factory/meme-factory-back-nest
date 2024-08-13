import {
	Injectable,
	NotFoundException,
	InternalServerErrorException,
	ForbiddenException
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import {
	Application,
	ApplicationStatus,
	Prisma,
	Project,
	ProjectStatus,
	ResponseStatus,
	TaskResponse,
	User,
	UserRole,
	EventType
} from '@prisma/client'
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto'
import { TelegramUpdate } from 'src/telegram/telegram.update'
import { EventService } from 'src/event/event.service'

@Injectable()
export class ProjectService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly telegramUpdate: TelegramUpdate,
		private readonly eventService: EventService
	) {}

	private checkUserRole(user: User) {
		if (user.role !== UserRole.advertiser) {
			throw new ForbiddenException(
				'Only users with role advertiser can perform this action'
			)
		}
	}

	private async checkProjectOwnership(projectId: number, userId: number) {
		const project = await this.prisma.project.findUnique({
			where: { id: projectId }
		})
		if (!project) {
			throw new NotFoundException(`Project with ID ${projectId} not found`)
		}
		if (project.authorId !== userId) {
			throw new ForbiddenException('You can only modify your own projects')
		}
	}

	async createProject(
		createProjectDto: CreateProjectDto,
		user: User
	): Promise<Project> {
		this.checkUserRole(user)
		const {
			title,
			description,
			bannerUrl,
			files,
			tags,
			category,
			subtasks,
			price
		} = createProjectDto

		try {
			const project = await this.prisma.project.create({
				data: {
					authorId: user.id,
					title,
					description,
					bannerUrl,
					files,
					tags,
					category,
					price
				}
			})

			for (const subtask of subtasks) {
				await this.prisma.task.create({
					data: {
						title: subtask.title,
						description: subtask.description,
						price: subtask.price,
						projects: {
							create: {
								projectId: project.id
							}
						}
					}
				})
			}

			return project
		} catch (error) {
			throw new InternalServerErrorException(
				`Ошибка при создании проекта: ${error}`
			)
		}
	}

	async getProjectById(id: number): Promise<Project | null> {
		try {
			const project = await this.prisma.project.findUnique({
				where: { id },
				include: {
					tasks: {
						include: {
							task: true
						}
					}
				}
			})
			if (!project) {
				throw new NotFoundException()
			}
			return project
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw new NotFoundException(`Проект с ID ${id} не найден`)
			}

			throw new InternalServerErrorException(
				`Ошибка при получении проекта: ${error}`,
				error
			)
		}
	}

	async getAllProjects(
		tags?: string[],
		category?: string,
		page: number = 1,
		limit: number = 10
	): Promise<{ projects: Project[]; total: number }> {
		try {
			const whereClause: Prisma.ProjectWhereInput = {}

			if (tags && tags.length > 0) {
				whereClause.tags = {
					hasSome: tags
				}
			}

			if (category) {
				whereClause.category = category
			}

			const skip = (page - 1) * limit
			const take = limit

			const total = await this.prisma.project.count({
				where: whereClause
			})

			const projects = await this.prisma.project.findMany({
				where: whereClause,
				include: {
					tasks: {
						include: {
							task: true
						}
					}
				},
				skip,
				take
			})

			return {
				projects,
				total
			}
		} catch (error) {
			throw new InternalServerErrorException(
				`Ошибка при получении всех проектов: ${error}`
			)
		}
	}

	async getAllProjectsByUserId(userId: number) {
		try {
			return await this.prisma.project.findMany({
				where: { authorId: userId },
				include: { tasks: true }
			})
		} catch (error) {
			throw new InternalServerErrorException(
				'Ошибка при получении проектов пользователя',
				error
			)
		}
	}

	async updateProject(
		id: number,
		updateProjectDto: UpdateProjectDto,
		user: User
	): Promise<Project> {
		this.checkUserRole(user)
		this.checkProjectOwnership(id, user.id)
		const {
			title,
			description,
			bannerUrl,
			files,
			tags,
			category,
			subtasks,
			price
		} = updateProjectDto

		try {
			const projectExists = await this.prisma.project.findUnique({
				where: { id }
			})
			if (!projectExists) {
				throw new NotFoundException(`Проект с ID ${id} не найден`)
			}

			const project = await this.prisma.project.update({
				where: { id },
				data: {
					title,
					description,
					bannerUrl,
					files,
					tags,
					category,
					price
				}
			})

			if (subtasks) {
				const existingTasks = await this.prisma.task.findMany({
					where: {
						projects: {
							some: {
								projectId: id
							}
						}
					}
				})

				const existingTaskIds = existingTasks.map(task => task.id)
				const newTaskIds = subtasks
					.map(task => task.id)
					.filter(id => id !== undefined)

				const tasksToDelete = existingTaskIds.filter(
					taskId => !newTaskIds.includes(taskId)
				)
				if (tasksToDelete.length > 0) {
					await this.prisma.projectTask.deleteMany({
						where: {
							projectId: id,
							taskId: { in: tasksToDelete }
						}
					})

					await this.prisma.task.deleteMany({
						where: { id: { in: tasksToDelete } }
					})
				}

				for (const subtask of subtasks) {
					if (subtask.id) {
						await this.prisma.task.update({
							where: { id: subtask.id },
							data: {
								title: subtask.title,
								description: subtask.description,
								price: subtask.price
							}
						})
					} else {
						await this.prisma.task.create({
							data: {
								title: subtask.title,
								description: subtask.description,
								price: subtask.price,
								projects: {
									create: {
										projectId: id
									}
								}
							}
						})
					}
				}
			}

			return project
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error
			}
			throw new InternalServerErrorException(
				'Ошибка при обновлении проекта:',
				error
			)
		}
	}

	// потом передеваль в status: closed
	async deleteProject(id: number): Promise<Project> {
		try {
			const projectExists = await this.prisma.project.findUnique({
				where: { id }
			})
			if (!projectExists) {
				throw new NotFoundException(`Проект с ID ${id} не найден`)
			}

			return this.prisma.$transaction(async prisma => {
				await prisma.projectTask.deleteMany({
					where: { projectId: id }
				})

				await prisma.task.deleteMany({
					where: {
						projects: {
							some: {
								projectId: id
							}
						}
					}
				})

				return prisma.project.delete({
					where: { id }
				})
			})
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error
			}
			throw new InternalServerErrorException('Ошибка при удалении проекта')
		}
	}

	async updateProjectStatus(
		id: number,
		status: ProjectStatus,
		user: User
	): Promise<Project> {
		this.checkUserRole(user)
		await this.checkProjectOwnership(id, user.id)

		try {
			const project = await this.prisma.project.update({
				where: { id },
				data: { status }
			})

			return project
		} catch (error) {
			throw new InternalServerErrorException(
				`Ошибка при обновлении статуса проекта: ${error}`
			)
		}
	}

	async applyToProject(user: User, projectId: number) {
		try {
			const application = await this.prisma.application.create({
				data: {
					userId: user.id,
					projectId
				}
			})

			await this.eventService.createEvent({
				userId: user.id,
				projectId,
				role: user.role,
				eventType: EventType.APPLICATION_SUBMITTED,
				description: 'Заявка на участие в проекте подана.'
			})

			return application
		} catch (error) {
			throw new InternalServerErrorException(
				`Ошибка при подаче заявки на проект: ${error}`
			)
		}
	}

	async respondToTask(user: User, taskId: number) {
		try {
			const response = await this.prisma.taskResponse.create({
				data: {
					userId: user.id,
					taskId
				}
			})

			await this.eventService.createEvent({
				userId: user.id,
				projectId: (
					await this.prisma.projectTask.findFirst({ where: { taskId: taskId } })
				).projectId,
				role: user.role,
				eventType: EventType.TASK_UPDATED,
				description: 'Отклик на задание.',
				details: { subtaskId: taskId }
			})

			return response
		} catch (error) {
			throw new InternalServerErrorException(
				`Ошибка при отклике на задание: ${error}`
			)
		}
	}

	async confirmProjectApplication(
		user: User,
		eventId: number,
		isApproved: boolean
	) {
		try {
			const event = await this.prisma.event.findUnique({ where: { id: eventId } })
			const response = await this.eventService.createEvent({
				userId: user.id,
				projectId: event.projectId,
				role: user.role,
				eventType: isApproved
					? EventType.APPLICATION_APPROVED
					: EventType.APPLICATION_REJECTED,
				description:
					`Участие в проекте ${event.projectId} для пользователя ID ${event.userId} ` + isApproved ? 'подтверждено' : 'отклонено',
				details: {
					toUserId: event.userId
				}
			})

			return response
		} catch (error) {
			throw new InternalServerErrorException(
				`Ошибка при подтверждении заявки на проект: ${error.message}`
			)
		}
	}

	async confirmTaskCompletion(
		user: User,
		creatorUserId: number,
		taskId: number
	) {
		try {
			await this.prisma.$transaction(async prisma => {
				const transaction = await prisma.transaction.create({
					data: {
						amount: (
							await this.prisma.task.findFirst({ where: { id: taskId } })
						).price,
						fromUserId: user.id,
						toUserId: creatorUserId,
						taskId: taskId,
						projectId: (
							await this.prisma.projectTask.findFirst({
								where: { taskId: taskId }
							})
						).projectId
					}
				})

				await this.eventService.createEvent({
					projectId: transaction.projectId,
					userId: transaction.fromUserId,
					role: user.role,
					eventType: EventType.TASK_COMPLETED,
					description: 'Транзакция завершена.',
					details: {
						transactionId: transaction.id,
						amount: transaction.amount
					}
				})
			})
		} catch (error) {
			throw new InternalServerErrorException(
				`Ошибка при подтверждении выполнения задания: ${error.message}`
			)
		}
	}

	async updateProjectApplicationStatus(
		id: number,
		status: ApplicationStatus,
		user: User
	): Promise<Application> {
		this.checkUserRole(user)
		await this.checkProjectOwnership(id, user.id)

		try {
			const application = await this.prisma.application.update({
				where: { id },
				data: { status }
			})

			return application
		} catch (error) {
			throw new InternalServerErrorException(
				`Ошибка при обновлении статуса заявки на проект: ${error}`
			)
		}
	}

	async updateTaskResponseStatus(
		id: number,
		status: ResponseStatus,
		user: User
	): Promise<TaskResponse> {
		this.checkUserRole(user)
		await this.checkProjectOwnership(id, user.id)

		try {
			const response = await this.prisma.taskResponse.update({
				where: { id },
				data: { status }
			})

			return response
		} catch (error) {
			throw new InternalServerErrorException(
				`Ошибка при обновлении статуса заявки на задачу: ${error}`
			)
		}
	}

	async sendProjectFilesToTelegram(
		projectId: number,
		telegramId: string
	): Promise<void> {
		const project = await this.getProjectById(projectId)
		if (!project || !project.files) {
			throw new NotFoundException(
				'Проект или файлы для данного проекта не найдены.'
			)
		}

		const files: string[] = Array.isArray(project.files)
			? (project.files as string[])
			: JSON.parse(project.files as any)

		await this.telegramUpdate.sendFilesToUser(telegramId, files)
	}
}
