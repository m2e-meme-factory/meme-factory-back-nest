import {
	Controller,
	Get,
	Post,
	Param,
	Body,
	NotFoundException,
	ParseIntPipe,
	HttpCode,
	HttpStatus,
  Req,
  Query
} from '@nestjs/common'
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiParam,
	ApiBody,
	ApiBearerAuth,
  ApiQuery
} from '@nestjs/swagger'
import { AutoTaskService } from './auto-task.service'
import { AutoTask } from '@prisma/client'
import { CreateAutoTaskDto, GetAutoTaskDto } from './dto/create-auto-task.dto'
import { PublicRoute } from 'src/auth/decorators/public-route.decorator'

@ApiBearerAuth('access-token')
@ApiTags('autotask-applications')
@Controller('autotask-applications')
export class AutoTaskController {
	constructor(private readonly autoTaskService: AutoTaskService) {}

	@Get()
	@ApiOperation({ summary: 'Get all auto tasks' })
	@ApiResponse({
		status: 200,
		description: 'Return all auto tasks.',
		type: [GetAutoTaskDto]
	})
  @ApiQuery({ name: 'userId', required: false, type: Number, example: 1, description: 'Фильтр по user ID (опционально)' })
  @PublicRoute()
	async getAllAutoTasks(@Query('userId') userId?: string): Promise<AutoTask[]> {
		return this.autoTaskService.getAllAutoTasks(Number(userId))
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get auto task by ID' })
	@ApiParam({ name: 'id', description: 'ID of the task' })
	@ApiResponse({
		status: 200,
		description: 'Return the auto task.',
		type: GetAutoTaskDto
	})
	@ApiResponse({ status: 404, description: 'Task not found' })
  @PublicRoute()
	async getAutoTaskById(
		@Param('id', ParseIntPipe) id: number
	): Promise<AutoTask | null> {
		const task = await this.autoTaskService.getAutoTaskById(id)
		if (!task) {
			throw new NotFoundException('Task not found')
		}
		return task
	}

	@Post()
	@ApiOperation({ summary: 'Apply for a new auto task' })
	@ApiBody({ type: CreateAutoTaskDto })
	@ApiResponse({
		status: 201,
		description: 'Task created successfully.',
		type: CreateAutoTaskDto
	})
	@HttpCode(HttpStatus.CREATED)
	async applyForTask(
		@Body() createAutoTaskDto: CreateAutoTaskDto,
    @Req() req: Request
	): Promise<AutoTask> {
    const user = req["user"]
		return this.autoTaskService.applyForTask(createAutoTaskDto, user)
	}

	@Post(':id/claim')
	@ApiOperation({ summary: 'Claim the reward for a task' })
	@ApiParam({ name: 'id', description: 'ID of the task' })
	@ApiBody({
		description: 'userId',
		schema: {
			type: 'object',
			properties: {
				userId: {
					type: 'number',
					example: '1'
				}
			}
		}
	})
	@ApiResponse({
		status: 200,
		description: 'Task confirmed and reward claimed.',
		type: CreateAutoTaskDto
	})
	@ApiResponse({ status: 403, description: 'You cannot claim the reward yet.' })
	@ApiResponse({ status: 404, description: 'Task not found' })
	async claimTask(
		@Param('id', ParseIntPipe) id: number,
		@Body('userId', ParseIntPipe) userId: number
	): Promise<AutoTask> {
		return this.autoTaskService.claimTask(id, userId)
	}
}
