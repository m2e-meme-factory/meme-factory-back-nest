import {
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { EventType, ProgressStatus, User, UserRole } from '@prisma/client'
import { EventService } from 'src/event/event.service'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class ProjectProgressService {
	constructor(
		private readonly prisma: PrismaService,
		// private readonly telegramUpdate: TelegramUpdate,
		private readonly eventService: EventService
	) {}

	private checkUserRole(user: User, role: UserRole) {
		if (user.role !== role) {
			throw new ForbiddenException(
				`Only users with role ${role} can perform this action`
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

	async applyToProject(
		user: User,
		projectId: number,
		message: string = ''
	) {
		this.checkUserRole(user, UserRole.creator)
		try {
			const progressProject = await this.prisma.progressProject.create({
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
				description: 'Заявка на участие в проекте подана.',
				progressProjectId: progressProject.id,
				message
			})

			return progressProject
		} catch (error) {
			throw new Error(`Ошибка при подаче заявки на проект: ${error}`)
		}
	}

	async getAllProjectProgressByProjectId(
		user: User,
		projectId: number,
		creatorId?: number
	) {
		return await this.prisma.progressProject.findMany({
			where: { projectId, ...(creatorId && { userId: creatorId }) },
			include: { Event: true }
		})
	}

	async getAllProjectByCreatorId(creatorId: number) {
		return await this.prisma.progressProject.findMany({
			where: {
				userId: creatorId
			},
			include: {
				project: true
			}
		})
	}
	async getAllCreatorsByProjectId(projectId: number, status: ProgressStatus) {
		return await this.prisma.progressProject.findMany({
			where: {
				projectId,
				status
			},
			include: {
				user: true
			}
		})
	}

	async getProjectProgressEvents(
		progressProjectId: number,
		page: number = 1,
		limit: number = 10
	) {
		try {
            const total = await this.prisma.event.count({
                where: { progressProjectId: progressProjectId },
              });
          

			const skip = (page - 1) * limit

			const progressProject = await this.prisma.progressProject.findUnique({
				where: { id: progressProjectId },
				include: {
					Event: {
						skip: skip,
						take: limit
					}
				}
			})

			if (!progressProject) {
				throw new UnauthorizedException('Прогресс проекта не найден')
			}

			return {events: progressProject.Event, total}
		} catch (error) {
			throw new InternalServerErrorException(
				`Ошибка при получении событий прогресса проекта: ${error}`
			)
		}
	}

	async updateProjectProgressStatus(
		user: User,
		progressProjectId: number,
		status: ProgressStatus,
		message: string
	) {
		this.checkUserRole(user, UserRole.advertiser)
		const projectId = await (
			await this.prisma.progressProject.findUnique({
				where: { id: progressProjectId }
			})
		).projectId
		this.checkProjectOwnership(projectId, user.id)
		try {
			const updatedProgressProject = await this.prisma.progressProject.update({
				where: { id: progressProjectId },
				data: { status: status }
			})

			let eventType: EventType
			let description: string

			if (status === ProgressStatus.accepted) {
				eventType = EventType.APPLICATION_APPROVED
				description = 'Заявка на участие в проекте принята.'
			} else if (status === ProgressStatus.rejected) {
				eventType = EventType.APPLICATION_REJECTED
				description = 'Заявка на участие в проекте отклонена.'
			} else {
				throw new Error('Некорректный статус заявки')
			}

			await this.eventService.createEvent({
				userId: user.id,
				projectId: updatedProgressProject.projectId,
				role: user.role,
				eventType,
				description,
				progressProjectId: updatedProgressProject.id,
				message: message
			})

			return updatedProgressProject
		} catch (error) {
			throw new Error('Ошибка при обновлении статуса заявки')
		}
	}
}
