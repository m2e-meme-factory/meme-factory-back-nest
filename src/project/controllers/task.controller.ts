import { Body, Controller, Param, Post, Req } from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiParam,
	ApiBody
} from '@nestjs/swagger'
import { TaskProgressService } from '../services/task-progress.service'
import { IdValidationPipe } from 'src/pipes/id.validation.pipe'
import { RejectTaskCompletionDto } from '../dto/project.dto'
import { NotificationService } from 'src/notification/notification.service'
import { ProjectService } from '../services/project.service'
import { UserService } from 'src/user/user.service'
@ApiTags('tasks')
@ApiBearerAuth('access-token')
@Controller('tasks')
export class TaskController {
	constructor(
		private readonly taskProgressService: TaskProgressService,
		private readonly notificationService: NotificationService,
		private readonly userService: UserService,
		private readonly projectService: ProjectService
	) {}

	@Post(':taskId/apply-completion')
	@ApiOperation({
		summary: 'Подать заявку на завершение задачи',
		description:
			'Позволяет пользователю-исполнителю подать заявку на завершение задачи в рамках проекта.'
	})
	@ApiParam({
		name: 'taskId',
		description: 'ID задачи, на которую подается заявка на завершение.',
		example: 1
	})
	@ApiBody({
		description:
			'Сообщение от исполнителя при подаче заявки на завершение задачи.',
		schema: {
			type: 'object',
			properties: {
				message: {
					type: 'string',
					example: 'Работа завершена, все условия выполнены.'
				}
			}
		}
	})
	@ApiResponse({
		status: 201,
		description: 'Заявка на завершение задачи успешно подана.',
		schema: {
			example: {
				id: 42,
				userId: 1,
				projectId: 101,
				role: 'creator',
				eventType: 'TASK_SUBMIT',
				description: 'Заявка на завершение задачи подана.',
				message: 'Работа завершена, все условия выполнены.',
				progressProjectId: 201,
				details: {
					taskId: 1
				},
				createdAt: '2024-08-17T12:34:56.789Z'
			}
		}
	})
	@ApiResponse({ status: 404, description: 'Проект задачи не найден.' })
	@ApiResponse({
		status: 409,
		description: 'Заявка на задание уже подана или проект не одобрен.'
	})
	async applyToCompleteTask(
		@Param('taskId', IdValidationPipe) taskId: number,
		@Req() req: Request,
		@Body('message') message?: string
	) {
		const user = req['user']
		const result = await this.taskProgressService.applyToCompleteTask(
			user,
			taskId,
			message
		)
		const project = await this.projectService.getProjectById(result.projectId)
		const author = await this.userService.getUserById(project.project.authorId)

		// Уведомление для рекламодателя
		await this.notificationService.create({
			userId: author.telegramId,
			message: `Creator ${user.username ? `@${user.username}` : user.id} completed task: "${project.project.title}".`
		})

		return result
	}

	@Post(':taskId/approve-completion')
	@ApiOperation({
		summary: 'Одобрить завершение задачи',
		description:
			'Позволяет рекламодателю одобрить завершение задачи, что приведет к переводу средств исполнителю.'
	})
	@ApiParam({
		name: 'taskId',
		description: 'ID задачи, завершение которой необходимо одобрить.',
		example: 1
	})
	@ApiBody({
		description:
			'Идентификатор исполнителя и сообщение при одобрении завершения задачи.',
		schema: {
			type: 'object',
			properties: {
				creatorId: {
					type: 'number',
					example: 2,
					description: 'ID исполнителя, который завершил задачу.'
				},
				message: {
					type: 'string',
					example: 'Задача выполнена качественно и в срок.'
				}
			}
		}
	})
	@ApiResponse({
		status: 201,
		description: 'Задача успешно одобрена, средства переведены исполнителю.',
		schema: {
			example: {
				event: {
					id: 43,
					userId: 3,
					projectId: 101,
					role: 'advertiser',
					eventType: 'TASK_COMPLETED',
					description: 'Завершение задачи одобрено.',
					message: 'Задача выполнена качественно и в срок.',
					progressProjectId: 202,
					details: {
						taskId: 1
					},
					createdAt: '2024-08-17T12:45:56.789Z'
				},
				transaction: {
					id: 501,
					amount: 1500,
					fromUserId: 3,
					toUserId: 2,
					taskId: 1,
					projectId: 101,
					createdAt: '2024-08-17T12:46:00.123Z'
				}
			}
		}
	})
	@ApiResponse({
		status: 404,
		description: 'Задача или прогресс проекта не найдены.'
	})
	@ApiResponse({
		status: 500,
		description: 'Ошибка при одобрении завершения задачи.'
	})
	async approveTaskCompletion(
		@Param('taskId', IdValidationPipe) taskId: number,
		@Req() req: Request,
		@Body('creatorId') creatorId: number,
		@Body('eventId') eventId: number,
		@Body('message') message?: string
	) {
		const user = req['user']
		const result = await this.taskProgressService.approveTaskCompletion(
			user,
			taskId,
			creatorId,
			eventId,
			message
		)
		const project = await this.projectService.getProjectById(
			result.event.projectId
		)
		const creator = await this.userService.getUserById(creatorId)

		// Уведомление для исполнителя
		await this.notificationService.create({
			userId: creator.telegramId,
			message: `
🎉 Congratulations 🎉
💸 You earned some M2E in "${project.project.title}" 

View updated balance in App 🔽
`
		})

		return result
	}

	@Post(':taskId/reject-completion')
	@ApiOperation({ summary: 'Отклонить завершение задачи' })
	@ApiParam({ name: 'taskId', type: Number, description: 'ID задачи' })
	@ApiBody({
		description: 'Данные для отклонения завершения задачи',
		type: RejectTaskCompletionDto
	})
	@ApiResponse({
		status: 200,
		description: 'Завершение задачи успешно отклонено.',
		schema: {
			example: {
				event: {
					id: 1,
					userId: 1,
					projectId: 1,
					role: 'advertiser',
					eventType: 'TASK_REJECTED',
					description: 'Завершение задачи отклонено.',
					message: 'Задача выполнена неверно.',
					details: {
						taskId: 1
					}
				}
			}
		}
	})
	@ApiResponse({
		status: 404,
		description: 'Задача или прогресс проекта не найдены.'
	})
	@ApiResponse({
		status: 500,
		description: 'Ошибка при отклонении завершения задачи.'
	})
	async rejectTaskCompletion(
		@Req() req: Request,
		@Param('taskId', IdValidationPipe) taskId: number,
		@Body() body: RejectTaskCompletionDto
	) {
		const user = req['user']
		const { creatorId, message, eventId } = body

		const result = await this.taskProgressService.rejectTaskCompletion(
			user,
			taskId,
			creatorId,
			eventId,
			message
		)
		const project = await this.projectService.getProjectById(
			result.event.projectId
		)
		const creator = await this.userService.getUserById(creatorId)

		// Уведомление для исполнителя
		await this.notificationService.create({
			userId: creator.telegramId,
			message: `
Task was rejected 😢
In project: "${project.project.title}" 

See more details in App 🔽
`
		})

		return result
	}
}
