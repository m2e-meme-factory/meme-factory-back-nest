import {
	Controller,
	Post,
	Get,
	Query,
	Body,
	Param,
	HttpCode,
	HttpStatus,
	BadRequestException,
	Put
} from '@nestjs/common'
import { UserService } from './user.service'
import {
	ApiOkResponse,
	ApiBadRequestResponse,
	ApiTags,
	ApiQuery,
	ApiBearerAuth,
	ApiResponse,
	ApiOperation,
	ApiParam,
	ApiBody
} from '@nestjs/swagger'
import { PublicRoute } from 'src/auth/decorators/public-route.decorator'
import { User, UserRole } from '@prisma/client'
import { UpdateUserBalanceDto, UpdateUserRoleDto } from './dto/user.dto'
import { IdValidationPipe } from 'src/pipes/id.validation.pipe'

@ApiTags('users')
@Controller('users')
@ApiBearerAuth('access-token')
export class UserController {
	constructor(private readonly userService: UserService) {}

	// @Post('create')
	// @ApiCreatedResponse({
	// 	description: 'The user has been successfully created.',
	// 	schema: {
	// 		example: {
	// 			id: 3,
	// 			telegramId: '123456789',
	// 			username: '123456789',
	// 			isBaned: false,
	// 			isVerified: false,
	// 			createdAt: '2024-07-31T15:32:51.022Z',
	// 			inviterRefCode: '5678',
	// 			refCode: '123456789'
	// 		},
	// 		properties: {
	// 			id: { type: 'number' },
	// 			telegramId: { type: 'string' },
	// 			username: { type: 'string' },
	// 			isBaned: { type: 'boolean' },
	// 			isVerified: { type: 'boolean' },
	// 			createdAt: { type: 'string', format: 'date-time' },
	// 			inviterRefCode: { type: 'string', nullable: true },
	// 			refCode: { type: 'string' }
	// 		}
	// 	}
	// })
	// @ApiBadRequestResponse({ description: 'Bad Request.' })
	// async createUser(@Body() createUserDto) {
	// 	return await this.userService.createUser(createUserDto)
	// }

	@Post('is_user_verified')
	@HttpCode(HttpStatus.OK)
	@ApiOkResponse({
		description: 'Returns whether the user is verified.',
		schema: {
			example: { isUser: true },
			properties: {
				isUser: { type: 'boolean' }
			}
		}
	})
	@ApiBadRequestResponse({ description: 'Bad Request.' })
	async isUserVerified(@Body() body): Promise<{ isUser: boolean }> {
		const { userId } = body
		try {
			return await this.userService.isUserVerified(userId)
		} catch (error) {
			throw new BadRequestException(error.message)
		}
	}

	@Post('verify_user')
	@HttpCode(HttpStatus.OK)
	@ApiOkResponse({
		description: 'Verifies the user and returns the updated user data.',
		schema: {
			example: {
				id: 2,
				telegramId: '12345678',
				username: '12345678',
				isBaned: false,
				isVerified: true,
				createdAt: '2024-07-31T15:32:24.768Z',
				inviterRefCode: '5678',
				refCode: '12345678'
			},
			properties: {
				id: { type: 'number' },
				telegramId: { type: 'string' },
				username: { type: 'string' },
				isBaned: { type: 'boolean' },
				isVerified: { type: 'boolean' },
				createdAt: { type: 'string', format: 'date-time' },
				inviterRefCode: { type: 'string', nullable: true },
				refCode: { type: 'string' }
			}
		}
	})
	@ApiBadRequestResponse({ description: 'Bad Request.' })
	async verifyUser(@Body() body) {
		const { userId } = body
		try {
			return await this.userService.verifyUser(userId)
		} catch (error) {
			throw new BadRequestException(error.message)
		}
	}

	@Get('referals_info')
	@HttpCode(HttpStatus.OK)
	@ApiOkResponse({
		description: 'Returns the count of referrals for the given refId.',
		schema: {
			example: { count: 2 },
			properties: {
				count: { type: 'number' }
			}
		}
	})
	@ApiBadRequestResponse({ description: 'Bad Request.' })
	@ApiQuery({
		name: 'telegramId',
		type: 'string',
		description: 'Telegram ID of the user to count refs for.'
	})
	@PublicRoute()
	async getReferalsCount(@Query() query): Promise<{ count: number }> {
		const { telegramId } = query
		try {
			return await this.userService.getReferalsCount(telegramId)
		} catch (error) {
			throw new BadRequestException(error.message)
		}
	}

	@Get('get_user_data')
	@HttpCode(HttpStatus.OK)
	@ApiOkResponse({
		description: 'Returns user data for the given userId.',
		schema: {
			example: {
				id: 1,
				telegramId: '1234567',
				username: '1234567',
				role: UserRole.creator,
				balance: 0,
				isBaned: false,
				isVerified: true,
				createdAt: '2024-07-31T15:19:16.000Z',
				inviterRefCode: null,
				refCode: '1234567'
			},
			properties: {
				id: { type: 'number' },
				telegramId: { type: 'string' },
				username: { type: 'string' },
				role: {type: UserRole.creator},
				balance: { type: 'number' },
				isBaned: { type: 'boolean' },
				isVerified: { type: 'boolean' },
				createdAt: { type: 'string', format: 'date-time' },
				inviterRefCode: { type: 'string', nullable: true },
				refCode: { type: 'string' }
			}
		}
	})
	@ApiBadRequestResponse({ description: 'Bad Request.' })
	@ApiQuery({
		name: 'userId',
		type: 'string',
		description: 'Telegram ID of the user to retrieve data for.'
	})
	async getUserData(@Query() query) {
		const { userId } = query
		try {
			return await this.userService.getUserData(userId)
		} catch (error) {
			throw new BadRequestException(error.message)
		}
	}

	@Get('')
	@HttpCode(HttpStatus.OK)
	@ApiOkResponse({
		description: 'Returns a list of all users.',
		schema: {
			example: [
				{
					id: 1,
					telegramId: '1234567',
					username: '1234567',
					role: UserRole.creator,
					balance: 0,
					isBaned: false,
					isVerified: true,
					createdAt: '2024-07-31T15:19:16.000Z',
					inviterRefCode: null,
					refCode: '1234567'
				},
				{
					id: 2,
					telegramId: '12345678',
					username: '12345678',
					role: UserRole.creator,
					balance: 0,
					isBaned: false,
					isVerified: true,
					createdAt: '2024-07-31T15:32:24.768Z',
					inviterRefCode: '5678',
					refCode: '12345678'
				},
				{
					id: 3,
					telegramId: '123456789',
					username: '123456789',
					role: UserRole.creator,
					balance: 0,
					isBaned: false,
					isVerified: false,
					createdAt: '2024-07-31T15:32:51.022Z',
					inviterRefCode: '5678',
					refCode: '123456789'
				}
			],
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'number' },
					telegramId: { type: 'string' },
					username: { type: 'string' },
					role: {type: UserRole.creator},
					balance: { type: 'number' },
					isBaned: { type: 'boolean' },
					isVerified: { type: 'boolean' },
					createdAt: { type: 'string', format: 'date-time' },
					inviterRefCode: { type: 'string', nullable: true },
					refCode: { type: 'string' }
				}
			}
		}
	})
	@ApiBadRequestResponse({ description: 'Bad Request.' })
	@PublicRoute()
	async getAllUsers() {
		try {
			return await this.userService.getAllUsers()
		} catch (error) {
			throw new BadRequestException(error.message)
		}
	}

	@Get('/by-id/:userId')
	@HttpCode(HttpStatus.OK)
	@ApiOkResponse({
		description: 'Returns the user data for the given userId.',
		schema: {
			example: {
				id: 1,
				telegramId: '1234567',
				username: '1234567',
				role: UserRole.creator,
				balance: 0,
				isBaned: false,
				isVerified: true,
				createdAt: '2024-07-31T15:19:16.000Z',
				inviterRefCode: null,
				refCode: '1234567'
			},
			properties: {
				id: { type: 'number' },
				telegramId: { type: 'string' },
				username: { type: 'string' },
				role: {type: UserRole.creator},
				balance: { type: 'number' },
				isBaned: { type: 'boolean' },
				isVerified: { type: 'boolean' },
				createdAt: { type: 'string', format: 'date-time' },
				inviterRefCode: { type: 'string', nullable: true },
				refCode: { type: 'string' }
			}
		}
	})
	@ApiBadRequestResponse({ description: 'Bad Request.' })
	async getUserById(@Param('userId') userId: string) {
		try {
			return await this.userService.getUserById(parseInt(userId))
		} catch (error) {
			throw new BadRequestException(error.message)
		}
	}

	@Get('/by-telegram/:telegramId')
	@HttpCode(HttpStatus.OK)
	@ApiOkResponse({
		description: 'Returns the user data for the given telegramId.',
		schema: {
			example: {
				id: 1,
				telegramId: '1234567',
				username: '1234567',
				role: UserRole.creator,
				balance: 0,
				isBaned: false,
				isVerified: true,
				createdAt: '2024-07-31T15:19:16.000Z',
				inviterRefCode: null,
				refCode: '1234567'
			},
			properties: {
				id: { type: 'number' },
				telegramId: { type: 'string' },
				username: { type: 'string' },
				role: {type: UserRole.creator},
				balance: { type: 'number' },
				isBaned: { type: 'boolean' },
				isVerified: { type: 'boolean' },
				createdAt: { type: 'string', format: 'date-time' },
				inviterRefCode: { type: 'string', nullable: true },
				refCode: { type: 'string' }
			},
		}
	})
	@ApiBadRequestResponse({ description: 'Bad Request.' })
	@PublicRoute()
	async getUserByTelegramId(@Param('telegramId') telegramId: number) {
		try {
			return await this.userService.getUserByTelegramId(telegramId)
		} catch (error) {
			throw new BadRequestException(error.message)
		}
	}

	@Put(':id/role')
	@ApiOperation({ summary: 'Изменить роль пользователя' })
	@ApiParam({ name: 'id', description: 'ID пользователя' })
	@ApiBody({ type: UpdateUserRoleDto })
	@ApiResponse({
		status: 200,
		description: 'Роль пользователя успешно обновлена.',
		schema: {
			example: {
				id: 1,
				telegramId: '1234567',
				username: '1234567',
				role: UserRole.creator,
				balance: 0,
				isBaned: false,
				isVerified: true,
				createdAt: '2024-07-31T15:19:16.000Z',
				inviterRefCode: null,
				refCode: '1234567'
			}
		}
	})
	@ApiResponse({ status: 400, description: 'Неверные данные запроса.' })
	@ApiResponse({ status: 404, description: 'Пользователь не найден.' })
	@ApiResponse({ status: 403, description: 'Доступ запрещен.' })
	async updateUserRole(
		@Param('id', IdValidationPipe) id: number,
		@Body() updateUserRoleDto: UpdateUserRoleDto
	): Promise<User> {
		return this.userService.updateUserRole(id, updateUserRoleDto.role)
	}
	@Put(':id/balance')
	@ApiOperation({ summary: 'Изменить баланс пользователя' })
	@ApiParam({ name: 'id', description: 'ID пользователя' })
	@ApiBody({ type: UpdateUserBalanceDto })
	@ApiResponse({
		status: 200,
		description: 'Баланс пользователя успешно обновлен.',
		schema: {
			example: {
				id: 1,
				telegramId: '1234567',
				username: '1234567',
				role: UserRole.creator,
				balance: 1000,
				isBaned: false,
				isVerified: true,
				createdAt: '2024-07-31T15:19:16.000Z',
				inviterRefCode: null,
				refCode: '1234567'
			}
		}
	})
	@ApiResponse({ status: 400, description: 'Неверные данные запроса.' })
	@ApiResponse({ status: 404, description: 'Пользователь не найден.' })
	@ApiResponse({ status: 403, description: 'Доступ запрещен.' })
	async updateUserBalance(
		@Param('id', IdValidationPipe) id: number,
		@Body() updateUserBalanceDto: UpdateUserBalanceDto
	): Promise<User> {
		return this.userService.updateUserBalance(id, updateUserBalanceDto.balance)
	}
}
