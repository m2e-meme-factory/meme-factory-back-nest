import { Body, Controller, Post, Req } from '@nestjs/common'
import { TonService } from './ton.service'
import { UpdateUserInfoDto } from 'src/user-info/dto/user-info.dto'

@Controller('ton')
export class TonController {
	constructor(private readonly tonService: TonService) {}

	@Post('connect')
	async connect(@Body() updateUserInfoDto: UpdateUserInfoDto, @Req() req: Request) {
    const user = req["user"]
		const updatedUserInfo = await this.tonService.connectTonAddress(user.id, updateUserInfoDto)

    return updatedUserInfo
	}
}
