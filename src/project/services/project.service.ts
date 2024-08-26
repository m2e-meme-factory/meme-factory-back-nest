import {
	Injectable,
	NotFoundException,
	InternalServerErrorException
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { Prisma, Project, ProjectStatus, User, UserRole } from '@prisma/client'
import { CreateProjectDto, UpdateProjectDto } from '../dto/project.dto'
import { TelegramUpdate } from 'src/telegram/telegram.update'
// import { EventService } from 'src/event/event.service'
import { IDetails, IProjectResponse } from '../types/project.types'
import {
	checkProjectOwnership,
	checkUserRole,
	countProjectPrice
} from '../project.utils'

@Injectable()
export class ProjectService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly telegramUpdate: TelegramUpdate
		// private readonly eventService: EventService
	) {}

	async createProject(
		createProjectDto: CreateProjectDto,
		user: User
	): Promise<Project> {
		await checkUserRole(user, UserRole.advertiser)
		const { title, description, bannerUrl, files, tags, category, subtasks } =
			createProjectDto

		try {
			// const { minPrice, maxPrice } = countProjectPrice(subtasks)
			const project = await this.prisma.project.create({
				data: {
					authorId: user.id,
					title,
					description,
					bannerUrl,
					files,
					tags,
					category
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

	async getProjectById(id: number): Promise<IProjectResponse | null> {
		try {
			const project = await this.prisma.project.findUnique({
				where: { id },
				include: {
					tasks: {
						include: {
							task: true
						}
					},
					author: true
				}
			})
			if (!project) {
				throw new NotFoundException()
			}

			const { minPrice, maxPrice } = countProjectPrice(
				project.tasks.map(task => task.task)
			)

			return { project, minPrice, maxPrice }
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
	): Promise<{ projects: IProjectResponse[]; total: number }> {
		try {
			const whereClause: Prisma.ProjectWhereInput = {}

			whereClause.status = {
				not: 'closed'
			}

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
				take,
				orderBy: {
					id: 'desc'
				}
			})

			const transformedProjects: IProjectResponse[] = projects.map(project => {
				const { minPrice, maxPrice } = countProjectPrice(
					project.tasks.map(task => task.task)
				)

				return {
					project,
					minPrice,
					maxPrice
				}
			})

			return {
				projects: transformedProjects,
				total
			}
		} catch (error) {
			throw new InternalServerErrorException(
				`Ошибка при получении всех проектов: ${error}`
			)
		}
	}

	async getAllProjectsByUserId(
		userId: number,
		page: number = 1,
		limit: number = 10
	): Promise<{ projects: IProjectResponse[]; total: number }> {
		const offset = (page - 1) * limit

		try {
			const [projects, total] = await this.prisma.$transaction([
				this.prisma.project.findMany({
					where: { authorId: userId },
					include: { tasks: { include: { task: true } } },
					skip: offset,
					take: limit
				}),
				this.prisma.project.count({ where: { authorId: userId } })
			])

			const transformedProjects: IProjectResponse[] = projects.map(project => {
				const { minPrice, maxPrice } = countProjectPrice(
					project.tasks.map(task => task.task)
				)

				return {
					project,
					minPrice,
					maxPrice
				}
			})

			return { projects: transformedProjects, total }
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
	): Promise<IProjectResponse> {
		await checkUserRole(user, UserRole.advertiser)
		await checkProjectOwnership(id, user.id)
		const {
			title,
			description,
			bannerUrl,
			files,
			tags,
			category,
			subtasks,
			deletedTasks
		} = updateProjectDto

		try {
			const projectExists = await this.prisma.project.findUnique({
				where: { id }
			})
			if (!projectExists) {
				throw new NotFoundException('Проект с ID ${id} не найден')
			}

			const project = await this.prisma.project.update({
				where: { id },
				data: {
					title,
					description,
					bannerUrl,
					files,
					tags,
					category
				}
			})

			if (subtasks) {
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

			if (deletedTasks && deletedTasks.length > 0) {
				for (const taskId of deletedTasks) {
					await this.prisma.projectTask.delete({
						where: {
							projectId_taskId: {
								projectId: id,
								taskId: taskId,
							},
						},
					});
				}
			}

			const { minPrice, maxPrice } = countProjectPrice(subtasks)

			return { project, minPrice, maxPrice }
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
	): Promise<IProjectResponse> {
		await checkUserRole(user, UserRole.advertiser)
		await checkProjectOwnership(id, user.id)

		try {
			const project = await this.prisma.project.update({
				where: { id },
				data: { status },
				include: {
					tasks: {
						include: { task: true }
					}
				}
			})

			const { minPrice, maxPrice } = countProjectPrice(
				project.tasks.map(task => task.task)
			)

			return { project, minPrice, maxPrice }
		} catch (error) {
			throw new InternalServerErrorException(
				`Ошибка при обновлении статуса проекта: ${error}`
			)
		}
	}

	// async respondToTask(user: User, taskId: number) {
	// 	try {
	// 		const response = await this.prisma.taskResponse.create({
	// 			data: {
	// 				userId: user.id,
	// 				taskId
	// 			}
	// 		})

	// 		await this.eventService.createEvent({
	// 			userId: user.id,
	// 			projectId: (
	// 				await this.prisma.projectTask.findFirst({ where: { taskId: taskId } })
	// 			).projectId,
	// 			role: user.role,
	// 			eventType: EventType.TASK_UPDATED,
	// 			description: 'Отклик на задание.',
	// 			details: { subtaskId: taskId }
	// 		})

	// 		return response
	// 	} catch (error) {
	// 		throw new InternalServerException(
	// 			`Ошибка при отклике на задание: ${error}`
	// 		)
	// 	}
	// }

	// async confirmTaskCompletion(
	// 	user: User,
	// 	creatorUserId: number,
	// 	taskId: number
	// ) {
	// 	try {
	// 		await this.prisma.$transaction(async prisma => {
	// 			const transaction = await prisma.transaction.create({
	// 				data: {
	// 					amount: (
	// 						await this.prisma.task.findFirst({ where: { id: taskId } })
	// 					).price,
	// 					fromUserId: user.id,
	// 					toUserId: creatorUserId,
	// 					taskId: taskId,
	// 					projectId: (
	// 						await this.prisma.projectTask.findFirst({
	// 							where: { taskId: taskId }
	// 						})
	// 					).projectId
	// 				}
	// 			})

	// 			await this.eventService.createEvent({
	// 				projectId: transaction.projectId,
	// 				userId: transaction.fromUserId,
	// 				role: user.role,
	// 				eventType: EventType.TASK_COMPLETED,
	// 				description: 'Транзакция завершена.',
	// 				details: {
	// 					transactionId: transaction.id,
	// 					amount: transaction.amount
	// 				}
	// 			})
	// 		})
	// 	} catch (error) {
	// 		throw new InternalServerErrorException(
	// 			`Ошибка при подтверждении выполнения задания: ${error.message}`
	// 		)
	// 	}
	// }

	// async updateProjectApplicationStatus(
	// 	id: number,
	// 	status: ApplicationStatus,
	// 	user: User
	// ): Promise<Application> {
	// 	this.checkUserRole(user)
	// 	await this.checkProjectOwnership(id, user.id)

	// 	try {
	// 		const application = await this.prisma.application.update({
	// 			where: { id },
	// 			data: { status }
	// 		})

	// 		return application
	// 	} catch (error) {
	// 		throw new InternalServerErrorException(
	// 			`Ошибка при обновлении статуса заявки на проект: ${error}`
	// 		)
	// 	}
	// }

	// async updateTaskResponseStatus(
	// 	id: number,
	// 	status: ResponseStatus,
	// 	user: User
	// ): Promise<TaskResponse> {
	// 	this.checkUserRole(user)
	// 	await this.checkProjectOwnership(id, user.id)

	// 	try {
	// 		const response = await this.prisma.taskResponse.update({
	// 			where: { id },
	// 			data: { status }
	// 		})

	// 		return response
	// 	} catch (error) {
	// 		throw new InternalServerErrorException(
	// 			`Ошибка при обновлении статуса заявки на задачу: ${error}`
	// 		)
	// 	}
	// }

	async sendProjectFilesToTelegram(
		projectId: number,
		telegramId: string
	): Promise<void> {
		const project = await this.getProjectById(projectId)
		if (!project || !project.project.files) {
			throw new NotFoundException(
				'Проект или файлы для данного проекта не найдены.'
			)
		}

		const files: string[] = Array.isArray(project.project.files)
			? (project.project.files as string[])
			: JSON.parse(project.project.files as any)

		await this.telegramUpdate.sendFilesToUser(
			telegramId,
			files,
			project.project.title
		)
	}

	async calculateTotalProjectCost(
		user: User,
		projectId: number
	): Promise<number> {
		try {
			await checkUserRole(user, UserRole.advertiser)
			await checkProjectOwnership(projectId, user.id)
			const projectProgressList = await this.prisma.progressProject.findMany({
				where: { projectId },
				include: { events: true }
			})

			let totalAmount = 0

			projectProgressList.forEach(progress => {
				const completedTasks = progress.events.filter(
					event => event.eventType === 'TASK_COMPLETED'
				)

				completedTasks.forEach(event => {
					const { amount } = event.details as IDetails
					if (amount) {
						totalAmount += amount
					}
				})
			})

			return totalAmount
		} catch (error) {
			throw new InternalServerErrorException(
				`Ошибка при вычислении затрат на проект: ${error.message}`
			)
		}
	}
}
