import { Body, Controller, Param, Post, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { TaskProgressService } from '../services/task-progress.service'
import { IdValidationPipe } from 'src/pipes/id.validation.pipe'

@ApiTags('task')
@ApiBearerAuth('access-token')
@Controller('projects')
export class TaskController {
	constructor(private readonly taskProgressService: TaskProgressService) {}

	@Post(':projectId/task/:taskId/apply-completion')
	async applyToCompleteTask(
		@Param('taskId', IdValidationPipe) taskId: number,
		@Req() req: Request,
		@Body('message') message?: string
	) {
		const user = req['user']
		return this.taskProgressService.applyToCompleteTask(user, taskId, message)
	}

	@Post(':projectId/task/:taskId/approve-completion')
	async approveTaskCompletion(
		@Param('taskId', IdValidationPipe) taskId: number,
		@Req() req: Request,
		@Body('creatorId') creatorId: number,
		@Body('message') message?: string
	) {
		const user = req['user']
		return this.taskProgressService.approveTaskCompletion(
			user,
			taskId,
			creatorId,
			message
		)
	}
}
