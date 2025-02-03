import {
	Controller,
	Get,
	Param,
	Post,
	NotFoundException,
	ForbiddenException,
	InternalServerErrorException,
	Req,
	ParseIntPipe,
} from '@nestjs/common'
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiParam,
	ApiBearerAuth,
} from '@nestjs/swagger'
import { AutoTaskService } from './auto-task.service'
import { AutoTask, AutoTaskApplication } from '@prisma/client'
import { TaskStatusResponse } from './dto/task-status.dto'
import { GetAutoTaskDto } from './dto/create-auto-task.dto'

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
	async getAllAutoTasks(@Req() req: Request): Promise<AutoTask[]> {
		const userId = req["user"].id
		return await this.autoTaskService.getAllAutoTasks(userId)
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

	@ApiOperation({
		summary: 'Собрать награду за выполнение задачи'
	})
	@ApiParam({ name: 'taskId', description: 'ID авто-задачи' })
	@ApiResponse({
		status: 200,
		description: 'Награда успешно получена.'
	})
	@ApiResponse({
		status: 403,
		description: 'Награда уже получена или условия получения не выполнены.'
	})
	@ApiResponse({ status: 404, description: 'Задача не найдена.' })
	@Post(':taskId/claim')
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

	@ApiOperation({ summary: 'Получить статус всех задач для пользователя' })
	@ApiResponse({
		status: 200,
		description: 'Статусы задач получены успешно.',
		type: [TaskStatusResponse]
	})
	@ApiResponse({ status: 404, description: 'Пользователь не найден.' })
	@Get('status/all')
	async getTaskStatus(@Req() req: Request): Promise<TaskStatusResponse[]> {
		try {
			const userId = req['user'].id
			return await this.autoTaskService.getTaskStatus(userId)
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error
			}
			throw new InternalServerErrorException(error.message)
		}
	}

	@ApiOperation({ summary: 'Получить авто-задачи по категории' })
	@ApiParam({ 
		name: 'category', 
		description: 'Название категории задач',
		example: 'Daily Tasks'
	})
	@ApiResponse({ 
		status: 200, 
		description: 'Задачи найдены.',
		type: [GetAutoTaskDto]
	})
	@ApiResponse({ 
		status: 404, 
		description: 'Задачи для указанной категории не найдены.' 
	})
	@Get('category/:category')
	async getAutoTasksByCategory(
		@Param('category') category: string
	): Promise<AutoTask[]> {
		try {
			return await this.autoTaskService.getAutoTasksByCategory(category);
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			throw new InternalServerErrorException(error.message);
		}
	}
}
