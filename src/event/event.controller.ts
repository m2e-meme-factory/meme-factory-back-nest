import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { EventService } from './event.service'
import { PublicRoute } from 'src/auth/decorators/public-route.decorator'
import {
	ApiResponse,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiTags,
	ApiBody
} from '@nestjs/swagger'
import { CreateEventDto } from './dto/event.dto'

@Controller('events')
@ApiTags('events')
export class EventController {
	constructor(private readonly eventService: EventService) {}

	@Post()
	@ApiOperation({ summary: 'Create a new event' })
	@ApiBody({ type: CreateEventDto })
	@ApiResponse({
		status: 201,
		description: 'Event successfully created',
		schema: {
			type: 'object',
			properties: {
				id: { type: 'number', example: 1 },
				projectId: { type: 'number', example: 1 },
				userId: { type: 'number', example: 1 },
				role: { type: 'string', example: 'creator' },
				eventType: { type: 'string', example: 'APPLICATION_APPROVED' },
				description: {
					type: 'string',
					example: 'Application has been approved'
				},
				details: {
					type: 'object',
					additionalProperties: { type: 'string' },
					example: { transactionId: 123, amount: 500 }
				},
				createdAt: {
					type: 'string',
					format: 'date-time',
					example: '2024-08-16T20:01:22.146Z'
				}
			}
		}
	})
	@ApiResponse({ status: 500, description: 'Internal Server Error' })
	async createEvent(@Body() createEventDto: CreateEventDto) {
		return this.eventService.createEvent(createEventDto)
	}

	@Get()
	@PublicRoute()
	@ApiOperation({
		summary: 'Get all events with optional filtering and pagination'
	})
	@ApiQuery({
		name: 'userId',
		required: false,
		type: Number,
		description: 'Filter by userId'
	})
	@ApiQuery({
		name: 'projectId',
		required: false,
		type: Number,
		description: 'Filter by projectId'
	})
	@ApiQuery({
		name: 'page',
		required: false,
		type: Number,
		description: 'Page number',
		example: 1
	})
	@ApiQuery({
		name: 'limit',
		required: false,
		type: Number,
		description: 'Number of events per page',
		example: 10
	})
	@ApiResponse({
		status: 200,
		description: 'Returns a list of events',
		schema: {
			type: 'object',
			properties: {
				data: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							id: { type: 'number', example: 1 },
							projectId: { type: 'number', example: 1 },
							userId: { type: 'number', example: 1 },
							role: { type: 'string', example: 'creator' },
							eventType: { type: 'string', example: 'APPLICATION_APPROVED' },
							description: {
								type: 'string',
								example: 'Application has been approved'
							},
							details: {
								type: 'object',
								additionalProperties: { type: 'string' },
								example: { transactionId: 123, amount: 500 }
							},
							createdAt: {
								type: 'string',
								format: 'date-time',
								example: '2024-08-16T20:01:22.146Z'
							}
						}
					}
				},
				currentPage: { type: 'number', example: 1 },
				totalPages: { type: 'number', example: 1 },
				totalItems: { type: 'number', example: 0 }
			}
		}
	})
	async getAllEvents(
		@Query('userId') userId?: number,
		@Query('projectId') projectId?: number,
		@Query('page') page: number = 1,
		@Query('limit') limit: number = 10
	) {
		return this.eventService.getAllEvents(
			Number(userId),
			Number(projectId),
			Number(page),
			Number(limit)
		)
	}

	@Get('/history/:projectId')
	@PublicRoute()
	@ApiOperation({ summary: 'Get project event history' })
	@ApiParam({
		name: 'projectId',
		description: 'ID of the project',
		required: true
	})
	@ApiResponse({
		status: 200,
		description: 'Returns event history for the project.',
		schema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'number', example: 1 },
					projectId: { type: 'number', example: 1 },
					userId: { type: 'number', example: 1 },
					role: { type: 'string', example: 'creator' },
					eventType: { type: 'string', example: 'APPLICATION_APPROVED' },
					description: {
						type: 'string',
						example: 'Application has been approved'
					},
					details: {
						type: 'object',
						additionalProperties: { type: 'string' },
						example: { transactionId: 123, amount: 500 }
					},
					createdAt: {
						type: 'string',
						format: 'date-time',
						example: '2024-08-16T20:01:22.146Z'
					}
				}
			}
		}
	})
	@ApiResponse({ status: 404, description: 'Project or events not found.' })
	async getProjectHistory(@Param('projectId') projectId: number) {
		return this.eventService.getEventsByProjectId(Number(projectId))
	}
}
