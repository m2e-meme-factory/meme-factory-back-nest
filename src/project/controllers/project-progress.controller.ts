import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { IdValidationPipe } from 'src/pipes/id.validation.pipe'
import { ProjectProgressService } from '../services/project-progress.service'
import { ProgressStatus } from '@prisma/client'
import { PublicRoute } from 'src/auth/decorators/public-route.decorator'

@ApiTags('project-progress')
@ApiBearerAuth('access-token')
@Controller('projects')
export class ProjectProgressController {
	constructor(private readonly projectProgressService: ProjectProgressService) {}

	@ApiOperation({ summary: 'Получить прогресс проекта по ID проекта' })
	@ApiParam({ name: 'projectId', type: 'number', description: 'ID проекта' })
	@ApiResponse({
		status: 200,
		description: 'Успешное получение прогресса проекта'
	})
	@ApiQuery({
		name: 'creatorId',
		required: false,
		type: [String],
		example: '1'
	})
	@ApiResponse({ status: 401, description: 'Неавторизован' })
	@Get('progress/by-project/:projectId')
	async getAllProjectProgressByProjectId(
		@Param('projectId', IdValidationPipe) projectId: number,
		@Req() req: Request,
		@Query('creatorId') creatorId?: string,
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
		description: 'События прогресса проекта успешно получены'
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
	@ApiResponse({ status: 200, description: 'Заявка принята успешно' })
	@ApiResponse({ status: 401, description: 'Неавторизован' })
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
	@ApiResponse({ status: 200, description: 'Заявка отклонена успешно' })
	@ApiResponse({ status: 401, description: 'Неавторизован' })
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
    @PublicRoute()
	async getAllProjectByCreatorId(
		@Param('creatorId', IdValidationPipe) creatorId: number
	) {
		return this.projectProgressService.getAllProjectByCreatorId(creatorId)
	}

}
