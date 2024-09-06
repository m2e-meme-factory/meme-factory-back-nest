import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags
} from '@nestjs/swagger'
import { IdValidationPipe } from 'src/pipes/id.validation.pipe'
import { ProjectProgressService } from '../services/project-progress.service'
import { ProgressStatus } from '@prisma/client'

@ApiTags('project-progress')
@ApiBearerAuth('access-token')
@Controller('projects')
export class ProjectProgressController {
	constructor(
		private readonly projectProgressService: ProjectProgressService
	) {}

	@ApiOperation({ summary: 'Получить прогресс проекта по ID проекта' })
	@ApiParam({ name: 'projectId', type: 'number', description: 'ID проекта' })
	@ApiQuery({
		name: 'creatorId',
		required: false,
		type: String,
		example: '1',
		description: 'ID создателя (опционально)'
	})
	@ApiResponse({
		status: 200,
		description: 'Успешное получение прогресса проекта',
		schema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'number', example: 20 },
					userId: { type: 'number', example: 7 },
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
					},
					events: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								id: { type: 'number', example: 19 },
								projectId: { type: 'number', example: 20 },
								progressProjectId: { type: 'number', example: 20 },
								userId: { type: 'number', example: 7 },
								role: { type: 'string', example: 'creator' },
								eventType: { type: 'string', example: 'APPLICATION_SUBMITTED' },
								description: {
									type: 'string',
									example: 'Заявка на участие в проекте подана.'
								},
								createdAt: {
									type: 'string',
									format: 'date-time',
									example: '2024-08-16T20:01:22.149Z'
								},
								details: {
									type: 'object',
									nullable: true,
									properties: {
										taskId: { type: 'number', example: 19 }
									}
								},
								message: {
									type: 'string',
									nullable: true,
									example: 'Ты будешь лучшим сотрудником!'
								}
							}
						}
					}
				}
			}
		}
	})
	@ApiResponse({ status: 401, description: 'Неавторизован' })
	@Get('progress/by-project/:projectId')
	async getAllProjectProgressByProjectId(
		@Param('projectId', IdValidationPipe) projectId: number,
		@Req() req: Request,
		@Query('creatorId') creatorId?: string
	) {
		const user = req['user']
		return this.projectProgressService.getAllProjectProgressByProjectId(
			user,
			projectId,
			Number(creatorId)
		)
	}

	@ApiOperation({ summary: 'Получить события прогресса проекта по ID' })
	@ApiParam({
		name: 'progressProjectId',
		type: 'string',
		description: 'ID прогресса проекта'
	})
	@ApiResponse({
		status: 200,
		description: 'События прогресса проекта успешно получены',
		schema: {
			type: 'object',
			properties: {
				events: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							id: { type: 'number', example: 19 },
							projectId: { type: 'number', example: 20 },
							progressProjectId: { type: 'number', example: 20 },
							userId: { type: 'number', example: 7 },
							role: { type: 'string', example: 'creator' },
							eventType: { type: 'string', example: 'APPLICATION_SUBMITTED' },
							description: {
								type: 'string',
								example: 'Заявка на участие в проекте подана.'
							},
							createdAt: {
								type: 'string',
								format: 'date-time',
								example: '2024-08-16T20:01:22.149Z'
							},
							details: {
								type: 'object',
								nullable: true,
								properties: {
									taskId: { type: 'number', example: 19 }
								}
							},
							message: {
								type: 'string',
								nullable: true,
								example: 'Ты будешь лучшим сотрудником!'
							}
						}
					}
				},
				total: { type: 'number', example: 10 }
			}
		}
	})
	@ApiResponse({ status: 404, description: 'Прогресс проекта не найден' })
	@Get('/progress/:progressProjectId/events')
	async getProjectProgressEvents(
		@Param('progressProjectId', IdValidationPipe) progressProjectId: number,
		@Query('page') page: string = '1',
		@Query('limit') limit: string = '10'
	) {
		return this.projectProgressService.getProjectProgressEvents(
			progressProjectId,
			Number(page),
			Number(limit)
		)
	}

	@ApiOperation({ summary: 'Принять заявку на участие в проекте' })
	@ApiParam({ name: 'id', type: 'number', description: 'ID прогресса проекта' })
	@ApiResponse({
		status: 200,
		description: 'Заявка принята успешно',
		schema: {
			example: {
				id: 20,
				userId: 7,
				projectId: 20,
				status: 'accepted',
				createdAt: '2024-08-16T20:01:22.146Z',
				updatedAt: '2024-08-16T20:10:33.159Z'
			}
		}
	})
	@ApiResponse({ status: 401, description: 'Неавторизован' })
	@ApiBody({
		description: 'Сообщение от заказчика при принятии заявки на проект.',
		schema: {
			type: 'object',
			properties: {
				message: {
					type: 'string',
					example: 'Вы нам подходите!'
				}
			}
		}
	})
	@Post('progress/:id/accept')
	async acceptApplication(
		@Param('id') id: number,
		@Req() req: Request,
		@Body('message') message?: string
	) {
		const user = req['user']
		return this.projectProgressService.updateProjectProgressStatus(
			user,
			Number(id),
			ProgressStatus.accepted,
			message
		)
	}

	@ApiOperation({ summary: 'Отклонить заявку на участие в проекте' })
	@ApiParam({ name: 'id', type: 'number', description: 'ID прогресса проекта' })
	@ApiResponse({
		status: 200,
		description: 'Заявка отклонена успешно',
		schema: {
			example: {
				id: 8,
				userId: 6,
				projectId: 16,
				status: 'rejected',
				createdAt: '2024-08-14T19:33:54.270Z',
				updatedAt: '2024-08-15T21:18:49.046Z'
			}
		}
	})
	@ApiResponse({ status: 401, description: 'Неавторизован' })
	@ApiBody({
		description: 'Сообщение от заказчика при отклонении заявки на проект.',
		schema: {
			type: 'object',
			properties: {
				message: {
					type: 'string',
					example: 'Вы нам не подходите!'
				}
			}
		}
	})
	@Post('progress/:id/reject')
	async rejectApplication(
		@Param('id') id: number,
		@Req() req: Request,
		@Body('message') message?: string
	) {
		const user = req['user']
		return this.projectProgressService.updateProjectProgressStatus(
			user,
			Number(id),
			ProgressStatus.rejected,
			message
		)
	}

	@Get('progress/by-creator/:creatorId')
	@ApiOperation({ summary: 'Получить все проекты по ID создателя' })
	@ApiParam({
		name: 'creatorId',
		type: 'number',
		description: 'ID создателя'
	})
	@ApiResponse({
		status: 200,
		description:
			'Список проектов, связанных с указанным создателем успешно получен',
		schema: {
			example: [
				{
					project: {
						id: 10,
						authorId: 7,
						title: 'test',
						description: 'test',
						bannerUrl: 'test',
						files: [
							'uploads/test/1c84fca7-79ed-49fb-a6ab-bc2dba31b359_iso.png',
							'uploads/test/1c84fca7-79ed-49fb-a6ab-bc2dba31b359_iso.png',
							'uploads/test/f114d6bd-33eb-4fa4-9eb6-45bddc6ef777_iso.png'
						],
						tags: ['priority'],
						category: 'testCategory',
						price: 100,
						status: 'draft'
					},
					progress: {
						id: 1,
						projectId: 10,
						status: 'pending',
						createdAt: '2024-08-14T14:05:26.592Z',
						updatedAt: '2024-08-14T14:05:26.592Z'
					}
				}
			]
		}
	})
	@ApiResponse({ status: 404, description: 'Проекты не найдены' })
	async getAllProjectByCreatorId(
		@Param('creatorId', IdValidationPipe) creatorId: number
	) {
		return this.projectProgressService.getAllProjectByCreatorId(creatorId)
	}
}
