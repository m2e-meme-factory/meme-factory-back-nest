import {
	ConflictException,
	// ConflictException,
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from '@nestjs/common'
import { EventType, ProgressStatus, User, UserRole } from '@prisma/client'
import { EventService } from 'src/event/event.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { checkUserRole } from '../project.utils'
import { IDetails } from '../types/project.types'

@Injectable()
export class TaskProgressService {
	constructor(
		private prisma: PrismaService,
		private eventService: EventService
	) {}

	async applyToCompleteTask(
		user: User,
		taskId: number,
		message?: string
	) {
		checkUserRole(user, UserRole.creator)

		try {
			const projectTask = await this.prisma.projectTask.findFirst({
				where: { taskId: taskId }
			})
			if (!projectTask) {
				throw new NotFoundException(`Проект задачи с ID ${taskId} не найден`)
			}

			const existingProgress = await this.prisma.progressProject.findFirst({
				where: {
					userId: user.id,
					projectId: projectTask.projectId,
					status: { in: [ProgressStatus.accepted] }
				},
				include: { events: true }
			})

			if (!existingProgress) {
				throw new ConflictException(
					'Заявка на проект не подана или не одобрена'
				)
			}

			if (
				existingProgress.events.some(item => {
					const details = item.details as IDetails | undefined
					return (
						details?.taskId === taskId &&
						item.eventType === EventType.TASK_SUBMIT
					)
				})
			) {
				throw new ConflictException('Заявка на задание уже подана')
			}

			const event = await this.eventService.createEvent({
				userId: user.id,
				projectId: projectTask.projectId,
				role: user.role,
				eventType: EventType.TASK_SUBMIT,
				description: 'Заявка на завершение задачи подана.',
				message: message,
				progressProjectId: existingProgress.id,
				details: {
					taskId: taskId
				}
			})

			return event
		} catch (error) {
			throw new InternalServerErrorException(
				`Ошибка при подаче заявки на завершение задачи: ${error}`
			)
		}
	}

	async approveTaskCompletion(
		user: User,
		taskId: number,
		creatorId: number,
		message?: string
	) {
		checkUserRole(user, UserRole.advertiser)
		try {
			return await this.prisma.$transaction(async prisma => {
				const task = await prisma.task.findFirst({ where: { id: taskId } })
				if (!task) {
					throw new NotFoundException(`Задача с ID ${taskId} не найдена`)
				}

				const projectTask = await prisma.projectTask.findFirst({
					where: { taskId: taskId }
				})
				if (!projectTask) {
					throw new NotFoundException(`Проект задачи с ID ${taskId} не найден`)
				}

				const transaction = await prisma.transaction.create({
					data: {
						amount: task.price,
						fromUserId: user.id,
						toUserId: creatorId,
						taskId: taskId,
						projectId: projectTask.projectId
					}
				})

				const existingProgress = await prisma.progressProject.findFirst({
					where: {
						projectId: projectTask.projectId,
						userId: creatorId,
						status: ProgressStatus.accepted
					}
				})

				if (!existingProgress) {
					throw new NotFoundException('Прогресс проекта не найден')
				}
				const event = await this.eventService.createEvent({
					userId: user.id,
					projectId: projectTask.projectId,
					role: user.role,
					eventType: EventType.TASK_COMPLETED,
					description: 'Завершение задачи одобрено.',
					message: message,
					progressProjectId: existingProgress.id,
					details: {
						taskId: taskId
					}
				})

				return { event: event, transaction: transaction }
			})
		} catch (error) {
			throw new InternalServerErrorException(
				`Ошибка при одобрении завершения задачи: ${error.message}`
			)
		}
	}
}
