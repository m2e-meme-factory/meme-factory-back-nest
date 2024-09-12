import {
	Controller,
	Get,
	Param,
	Post,
	Put,
	NotFoundException,
	ForbiddenException,
	InternalServerErrorException,
	Req,
	ParseIntPipe,
	Query
} from '@nestjs/common'
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiParam,
	ApiBearerAuth,
	ApiQuery
} from '@nestjs/swagger'
import { AutoTaskService } from './auto-task.service'
import { AutoTask, AutoTaskApplication } from '@prisma/client'

@ApiTags('auto-tasks')
@ApiBearerAuth('access-token')
@Controller('auto-tasks')
export class AutoTaskController {
	constructor(private readonly autoTaskService: AutoTaskService) {}

	@ApiOperation({ summary: 'Получить все авто-задачи' })
	@ApiResponse({
		status: 200,
		description: 'Список авто-задач получен успешно.'
	})
	@Get()
	async getAllAutoTasks(): Promise<AutoTask[]> {
		return await this.autoTaskService.getAllAutoTasks()
	}

	@ApiOperation({
		summary: 'Get all auto task applications with optional filters'
	})
	@ApiQuery({
		name: 'userId',
		required: false,
		description: 'Filter by user ID',
		example: 1
	})
	@ApiQuery({
		name: 'taskId',
		required: false,
		description: 'Filter by task ID',
		example: 1
	})
	@Get('applications')
	async getAutoTaskApplications(
		@Query('userId') userId?: number,
		@Query('taskId') taskId?: number
	): Promise<AutoTaskApplication[]> {
		return await this.autoTaskService.getAutoTaskApplications(
			Number(userId),
			Number(taskId)
		)
	}

	@ApiOperation({ summary: 'Получить авто-задачу по ID' })
	@ApiParam({ name: 'id', description: 'ID авто-задачи' })
	@ApiResponse({ status: 200, description: 'Задача найдена.' })
	@ApiResponse({ status: 404, description: 'Задача не найдена.' })
	@Get(':id')
	async getAutoTaskById(
		@Param('id', ParseIntPipe) id: number
	): Promise<AutoTask | null> {
		const task = await this.autoTaskService.getAutoTaskById(id)
		if (!task) {
			throw new NotFoundException('Task not found')
		}
		return task
	}

	@ApiOperation({ summary: 'Подать заявку на выполнение авто-задачи' })
	@ApiParam({ name: 'taskId', description: 'ID авто-задачи' })
	@ApiResponse({ status: 201, description: 'Заявка подана успешно.' })
	@ApiResponse({ status: 403, description: 'Заявка уже подана.' })
	@ApiResponse({ status: 404, description: 'Задача не найдена.' })
	@Post(':taskId/apply')
	async applyForTask(
		@Param('taskId', ParseIntPipe) taskId: number,
		@Req() req: Request
	): Promise<AutoTaskApplication> {
		try {
			const user = req['user']
			return await this.autoTaskService.applyForTask(taskId, user)
		} catch (error) {
			if (
				error instanceof ForbiddenException ||
				error instanceof NotFoundException
			) {
				throw error
			}
			throw new InternalServerErrorException(error.message)
		}
	}

	@ApiOperation({
		summary: 'Подтвердить выполнение задачи и получить вознаграждение'
	})
	@ApiParam({ name: 'taskId', description: 'ID авто-задачи' })
	@ApiResponse({
		status: 200,
		description: 'Задача подтверждена, вознаграждение начислено.'
	})
	@ApiResponse({
		status: 403,
		description: 'Задача уже подтверждена или рано для подтверждения.'
	})
	@ApiResponse({ status: 404, description: 'Заявка не найдена.' })
	@Put(':taskId/claim')
	async claimTask(
		@Param('taskId', ParseIntPipe) taskId: number,
		@Req() req: Request
	): Promise<AutoTaskApplication> {
		try {
			const user = req['user']
			return await this.autoTaskService.claimTask(taskId, user.id)
		} catch (error) {
			if (
				error instanceof ForbiddenException ||
				error instanceof NotFoundException
			) {
				throw error
			}
			throw new InternalServerErrorException(error.message)
		}
	}
}
