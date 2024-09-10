import {
	Injectable,
	NotFoundException,
	InternalServerErrorException,
	ForbiddenException
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Project, ProjectStatus, User } from '@prisma/client'
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto'

@Injectable()
export class ProjectService {
	constructor(private prisma: PrismaService) { }

	private checkUserRole(user: User) {
		if (user.role !== 'creator') {
			throw new ForbiddenException('Only users with role creator can perform this action');
		}
	}

	private async checkProjectOwnership(projectId: number, userId: number) {
		const project = await this.prisma.project.findUnique({
			where: { id: projectId },
		});
		if (!project) {
			throw new NotFoundException(`Project with ID ${projectId} not found`);
		}
		if (project.authorId !== userId) {
			throw new ForbiddenException('You can only modify your own projects');
		}
	}

	async createProject(createProjectDto: CreateProjectDto, user: User): Promise<Project> {
		this.checkUserRole(user);
		const {
			title,
			description,
			bannerUrl,
			files,
			tags,
			category,
			subtasks,

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
			throw new InternalServerErrorException('Ошибка при создании проекта:', error)
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
				'Ошибка при получении проекта:',
				error
			)
		}
	}

	async getAllProjects(): Promise<Project[]> {
		try {
			return await this.prisma.project.findMany({
				include: {
					tasks: {
						include: {
							task: true
						}
					}
				}
			})
		} catch (error) {
			throw new InternalServerErrorException(
				'Ошибка при получении всех проектов'
			)
		}
	}

	async getAllProjectsByUserId(userId: number) {
		try {

			return await this.prisma.project.findMany(
				{
					where: { authorId: userId },
					include: { tasks: true }
				}
			)
		}
		catch (error) {
			throw new InternalServerErrorException('Ошибка при получении проектов пользователя', error);
		}
	}

	async updateProject(
		id: number,
		updateProjectDto: UpdateProjectDto,
		user: User
	): Promise<Project> {
		this.checkUserRole(user);
		this.checkProjectOwnership(id, user.id)
		const {
			title,
			description,
			bannerUrl,
			files,
			tags,
			category,
			subtasks,
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
			throw new InternalServerErrorException('Ошибка при обновлении проекта:', error)
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

	async updateProjectStatus(id: number, status: ProjectStatus, user: User): Promise<Project> {
		this.checkUserRole(user);
		await this.checkProjectOwnership(id, user.id);

		try {
			const project = await this.prisma.project.update({
				where: { id },
				data: { status },
			});

			return project;
		} catch (error) {
			throw new InternalServerErrorException('Ошибка при обновлении статуса проекта:', error);
		}
	}
}

