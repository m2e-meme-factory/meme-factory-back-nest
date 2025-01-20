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
	Query,
	Body
} from '@nestjs/common'
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiParam,
	ApiBearerAuth,
	ApiQuery,
	ApiProperty,
	ApiBody
} from '@nestjs/swagger'
import { AutoTaskService } from './auto-task.service'
import { AutoTask, AutoTaskApplication } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library';
import { IsNotEmpty, IsDecimal } from 'class-validator';


export class ClaimTaskDto {
	@ApiProperty({
	  description: 'Сумма вознаграждения',
	  example: '100.50',
	})
	@IsNotEmpty()
	@IsDecimal()
	amount: Decimal;
  }

@ApiTags('auto-tasks')
@ApiBearerAuth('access-token')
@Controller('auto-task/default')
export class AutoTaskDefaultController {
	constructor(private readonly autoTaskService: AutoTaskService) {}

	
	@ApiOperation({
		summary: 'Подтвердить выполнение задачи и получить вознаграждение',
	  })
	  @ApiResponse({
		status: 200,
		description: 'Задача подтверждена, вознаграждение начислено.',
	  })
	  @ApiResponse({
		status: 403,
		description: 'Задача уже подтверждена или рано для подтверждения.',
	  })
	  @ApiResponse({ status: 404, description: 'Заявка не найдена.' })
	  @ApiBody({ type: ClaimTaskDto }) // Описываем тело запроса в Swagger
	  @Post('god-claim')
	  async claimTask(
		@Req() req: Request,
		@Body() claimTaskDto: ClaimTaskDto, // Извлекаем данные из тела запроса
	  ): Promise<{ isConfirmed: boolean }> {
		try {
		  const user = req['user'];
		  const { amount } = claimTaskDto;
	
		  return await this.autoTaskService.newTransaction(amount, user.id);
		} catch (error) {
		  if (
			error instanceof ForbiddenException ||
			error instanceof NotFoundException
		  ) {
			throw error;
		  }
		  throw new InternalServerErrorException(error.message);
		}
	  }
}
