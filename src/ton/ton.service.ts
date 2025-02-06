import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { AutoTaskService } from 'src/auto-task/auto-task.service'
import { UpdateUserInfoDto } from 'src/user-info/dto/user-info.dto'
import { UserInfoService } from 'src/user-info/user-info.service'
import { Address } from 'ton-core'

@Injectable()
export class TonService {
	constructor(
		private readonly userInfoService: UserInfoService,
		private readonly autoTaskService: AutoTaskService,
	) {}
	async connectTonAddress(userId: number, data: UpdateUserInfoDto) {
		try {
			const walletAddress = Address.parse(data.tonWalletAddress)

			const isValid = Address.isAddress(walletAddress)

			if (isValid) {
				const updatedUserInfo = await this.userInfoService.updateUserInfo(
					userId,
					data
				)
				
				try {
					await this.autoTaskService.claimAutoTaskByName('wallet', userId)
				}
				catch (err) {}

				return updatedUserInfo
			} else {
				throw new Error('Invalid signature')
			}
		} catch (error) {
			throw new InternalServerErrorException(`Ошибка при подключении кошелька Ton: ${error}`)
		}
	}
}
