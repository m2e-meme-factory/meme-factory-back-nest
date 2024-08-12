import { Controller, Get, Param } from '@nestjs/common';
import { EventService } from './event.service';
import { PublicRoute } from 'src/auth/decorators/public-route.decorator';
import { ApiResponse, ApiOperation, ApiParam } from '@nestjs/swagger';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}
  @Get()
  @PublicRoute()
  async getAllEvents() {
    return this.eventService.getAllEvents()
  }

  @Get('/history/:projectId')
  @PublicRoute()
  @ApiOperation({ summary: 'Получить историю событий для проекта' })
  @ApiParam({
    name: 'projectId',
    description: 'ID проекта для получения его истории событий',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Возвращает историю событий для проекта.',
  })
  @ApiResponse({
    status: 404,
    description: 'Проект или события для проекта не найдены.',
  })
  async getProjectHistory(@Param('projectId') projectId: number) {
    return this.eventService.getEventsByProjectId(Number(projectId));
  }
}
