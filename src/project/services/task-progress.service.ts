import {
	BadRequestException,
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
// import { IDetails } from '../types/project.types'
import { TransactionService } from 'src/transaction/transaction.service'
import { ProjectProgressService } from './project-progress.service'

@Injectable()
export class TaskProgressService {
	constructor(
		private prisma: PrismaService,
		private eventService: EventService,
		private transactionService: TransactionService,
		private projectProgressService: ProjectProgressService
	) {}

	async applyToCompleteTask(user: User, taskId: number, message?: string) {
		await checkUserRole(user, UserRole.creator)

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
					status: { in: [ProgressStatus.accepted, ProgressStatus.pending] }
				},
				include: { events: true }
			})

			if (!existingProgress) {
				throw new ConflictException('Заявка на проект не подана')
			}

			// const hasSubmitted = existingProgress.events.some((item, index) => {
			// 	const details = item.details as IDetails | undefined
			// 	if (
			// 		details?.taskId === taskId &&
			// 		item.eventType === EventType.TASK_SUBMIT
			// 	) {
			// 		for (let i = index + 1; i < existingProgress.events.length; i++) {
			// 			const nextEvent = existingProgress.events[i]
			// 			const nextDetails = nextEvent.details as IDetails | undefined
			// 			if (
			// 				nextDetails?.taskId === taskId &&
			// 				nextEvent.eventType === EventType.TASK_REJECTED
			// 			) {
			// 				return false
			// 			}
			// 		}
			// 		return true
			// 	}
			// 	return false
			// })

			// if (hasSubmitted) {
			// 	throw new ConflictException('Заявка на задание уже подана')
			// }

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
		eventId: number,
		message?: string
	) {
		try {
			await checkUserRole(user, UserRole.advertiser)

			const task = await this.prisma.task.findFirst({ where: { id: taskId } })
			if (!task) {
				throw new NotFoundException(`Задача с ID ${taskId} не найдена`)
			}

			const projectTask = await this.prisma.projectTask.findFirst({
				where: { taskId: taskId }
			})
			if (!projectTask) {
				throw new NotFoundException(`Проект задачи с ID ${taskId} не найден`)
			}

			const advertiser = await this.prisma.user.findFirst({
				where: { id: user.id }
			})
			if (!advertiser) {
				throw new NotFoundException(`Пользователь с ID ${user.id} не найден`)
			}

			if (advertiser.balance < task.price) {
				throw new BadRequestException(
					'Недостаточно средств для завершения задачи'
				)
			}

			const existingProgress = await this.prisma.progressProject.findFirst({
				where: {
					projectId: projectTask.projectId,
					userId: creatorId,
					status: { in: [ProgressStatus.accepted, ProgressStatus.pending] }
				}
			})

			if (!existingProgress) {
				throw new NotFoundException('Прогресс проекта не найден')
			}

			return await this.prisma.$transaction(async () => {
				try {
					const transaction = await this.transactionService.createTransaction({
						amount: task.price,
						fromUserId: user.id,
						toUserId: creatorId,
						taskId: taskId,
						projectId: projectTask.projectId,
						type: 'PAYMENT'
					})

					const event = await this.eventService.createEvent({
						userId: user.id,
						projectId: projectTask.projectId,
						role: user.role,
						eventType: EventType.TASK_COMPLETED,
						description: 'Завершение задачи одобрено.',
						message: message,
						progressProjectId: existingProgress.id,
						details: {
							taskId: taskId,
							transactionId: transaction.id,
							amount: transaction.amount,
							eventId: eventId
						}
					})

					if (existingProgress.status === ProgressStatus.pending) {
						await this.projectProgressService.updateProjectProgressStatus(
							user,
							existingProgress.id,
							ProgressStatus.accepted,
							'Автоматическое принятие заявки на проект после принятия задачи'
						)
					}

					return { event: event, transaction: transaction }
				} catch (error) {
					throw new Error(
						`Ошибка при создании транзакции или события: ${error.message}`
					)
				}
			})
		} catch (error) {
			if (
				error instanceof NotFoundException ||
				error instanceof BadRequestException
			) {
				throw error
			} else {
				throw new InternalServerErrorException(
					`Ошибка при одобрении завершения задачи: ${error.message}`
				)
			}
		}
	}

	async rejectTaskCompletion(
		user: User,
		taskId: number,
		creatorId: number,
		eventId: number,
		message?: string
	) {
		await checkUserRole(user, UserRole.advertiser)
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

				const existingProgress = await prisma.progressProject.findFirst({
					where: {
						projectId: projectTask.projectId,
						userId: creatorId,
						status: { in: [ProgressStatus.accepted, ProgressStatus.pending] }
					}
				})

				if (!existingProgress) {
					throw new NotFoundException('Прогресс проекта не найден')
				}

				const event = await this.eventService.createEvent({
					userId: user.id,
					projectId: projectTask.projectId,
					role: user.role,
					eventType: EventType.TASK_REJECTED,
					description: 'Завершение задачи отклонено.',
					message: message,
					progressProjectId: existingProgress.id,
					details: {
						taskId: taskId,
						eventId: eventId
					}
				})

				return { event: event }
			})
		} catch (error) {
			throw new InternalServerErrorException(
				`Ошибка при отклонении завершения задачи: ${error.message}`
			)
		}
	}
}
