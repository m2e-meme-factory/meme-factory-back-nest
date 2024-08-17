import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { EventService } from './event.service'
import { PublicRoute } from 'src/auth/decorators/public-route.decorator'
import { ApiResponse, ApiOperation, ApiParam, ApiQuery, ApiTags, ApiBody } from '@nestjs/swagger'
import { CreateEventDto } from './dto/event.dto';

@Controller('events')
@ApiTags('events')
export class EventController {
	constructor(private readonly eventService: EventService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiBody({type: CreateEventDto})
  @ApiResponse({ status: 201, description: 'Event successfully created', type: Event })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async createEvent(@Body() createEventDto: CreateEventDto) {
    return this.eventService.createEvent(createEventDto);
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
		type: [Event],
    example: {
      data: [],
      currentPage: 1,
      totalPages: 1,
      totalItems: 0
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
	@ApiOperation({ summary: 'Получить историю событий для проекта' })
	@ApiParam({
		name: 'projectId',
		description: 'ID проекта для получения его истории событий',
		required: true
	})
	@ApiResponse({
		status: 200,
		description: 'Возвращает историю событий для проекта.'
	})
	@ApiResponse({
		status: 404,
		description: 'Проект или события для проекта не найдены.'
	})
	async getProjectHistory(@Param('projectId') projectId: number) {
		return this.eventService.getEventsByProjectId(Number(projectId))
	}
}
