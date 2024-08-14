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

	async applyToProject(user: User, projectId: number) {
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
				progressProjectId: progressProject.id
			})

			return progressProject
		} catch (error) {
			throw new Error(`Ошибка при подаче заявки на проект: ${error}`)
		}
	}

	async getAllProjectProgressByProjectId(user: User, projectId: number) {
		return await this.prisma.progressProject.findMany({
			where: { projectId },
			include: { Event: true }
		})
	}

    async getAllProjectByCreatorId(creatorId) {
        return await this.prisma.progressProject.findMany({
            where: {
                userId: creatorId
            },
            include: {
                project: true
            }
        })
    }

	async getProjectProgressEvents(progressProjectId: number) {
		try {
			const progressProject = await this.prisma.progressProject.findUnique({
				where: { id: progressProjectId },
				include: {
					Event: true
				}
			})

			if (!progressProject) {
				throw new UnauthorizedException('Прогресс проекта не найден')
			}

			return progressProject.Event
		} catch (error) {
			throw new InternalServerErrorException(
				`Ошибка при получении событий прогресса проекта: ${error}`
			)
		}
	}

	async updateProjectProgressStatus(
		user: User,
		progressProjectId: number,
		status: ProgressStatus
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
				data: { status }
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
				progressProjectId: updatedProgressProject.id
			})

			return updatedProgressProject
		} catch (error) {
			throw new Error('Ошибка при обновлении статуса заявки')
		}
	}
}
