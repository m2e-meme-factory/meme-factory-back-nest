import {
	Controller,
	Get,
	Post,
	Req,
} from '@nestjs/common'
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiBody,
} from '@nestjs/swagger'
import { AutoTaskService } from './auto-task.service'
import { ClaimAutoTaskDto, } from './dto/create-auto-task.dto'

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
	async getAllUserClaimedAutoTasks(@Req() req: Request) {
		const userId = req["user"].id
		return await this.autoTaskService.getAllTasksStatus(userId)
	}

	@Post('name-claim')
	@ApiBody({
		type: ClaimAutoTaskDto,
		description: 'Название задачи для выполнения',
	  })
	async claimAutoTaskByName(
		@Req() req: Request
	){
		// try {
			const user = req['user'].id
			const taskName = req.body['taskName']

			return await this.autoTaskService.claimAutoTaskByName(taskName, user);
		// } catch (error) {
		// 	if (error instanceof NotFoundException) {
		// 		throw error;
		// 	}
		// 	throw new InternalServerErrorException(error.message);
		// }
	}
}
