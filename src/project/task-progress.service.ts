import {
	// ConflictException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { EventType, ProgressStatus, User } from '@prisma/client'
import { EventService } from 'src/event/event.service'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class TaskProgressService {
	constructor(
		private prisma: PrismaService,
		private eventService: EventService
	) {}

	async applyToCompleteTask(
		user: User,
		projectId: number,
		taskId: number,
		message?: string
	) {
		// this.checkUserRole(user, UserRole.creator);

		try {
			const existingProgress = await this.prisma.progressProject.findFirst({
				where: {
					userId: user.id,
					projectId,
					status: { in: [ProgressStatus.accepted, ProgressStatus.pending] }
				}
			})

			// if (existingProgress) {
			// 	throw new ConflictException(
			// 		'Заявка на завершение задачи уже подана или одобрена.'
			// 	)
			// }

			const event = await this.eventService.createEvent({
				userId: user.id,
				projectId,
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
			throw new Error(`Ошибка при подаче заявки на завершение задачи: ${error}`)
		}
	}

	async approveTaskCompletion(
		user: User,
		projectId: number,
		taskId: number,
		message?: string
	) {
		// this.checkUserRole(user, UserRole.creator);

		try {
			const existingProgress = await this.prisma.progressProject.findFirst({
				where: {
					project: {
                        authorId: user.id
                    },
					status: ProgressStatus.accepted
				}
			})

			if (!existingProgress) {
				throw new NotFoundException('Прогресс проекта не найден')
			}

			const event = await this.eventService.createEvent({
				userId: user.id,
				projectId,
				role: user.role,
				eventType: EventType.TASK_COMPLETED,
				description: 'Завершение задачи одобрено.',
				message: message,
				progressProjectId: existingProgress.id,
				details: {
					taskId: taskId
				}
			})

			return event
		} catch (error) {
			throw new Error(`Ошибка при одобрении завершения задачи: ${error}`)
		}
	}
}
