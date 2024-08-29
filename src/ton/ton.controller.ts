import { Body, Controller, Post, Req } from '@nestjs/common'
import { TonService } from './ton.service'
import { UpdateUserInfoDto } from 'src/user-info/dto/user-info.dto'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

@ApiTags('ton')
@Controller('ton')
export class TonController {
	constructor(private readonly tonService: TonService) {}

	@Post('connect')
	@ApiOperation({ summary: 'Connect TON Wallet Address to User Account' })
	@ApiResponse({
		status: 200,
		description: 'TON Wallet Address successfully connected.'
	})
	@ApiResponse({ status: 500, description: 'Internal Server Error.' })
	async connect(
		@Body() updateUserInfoDto: UpdateUserInfoDto,
		@Req() req: Request
	) {
		const user = req['user']
		const updatedUserInfo = await this.tonService.connectTonAddress(
			user.id,
			updateUserInfoDto
		)

		return updatedUserInfo
	}
}
