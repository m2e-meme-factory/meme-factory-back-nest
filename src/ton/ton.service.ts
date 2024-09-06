import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { UpdateUserInfoDto } from 'src/user-info/dto/user-info.dto'
import { UserInfoService } from 'src/user-info/user-info.service'
import { Address } from 'ton-core'

@Injectable()
export class TonService {
	constructor(private readonly userInfoService: UserInfoService) {}
	async connectTonAddress(userId: number, data: UpdateUserInfoDto) {
		try {
			const walletAddress = Address.parse(data.tonWalletAddress)

			const isValid = Address.isAddress(walletAddress)

			if (isValid) {
				const updatedUserInfo = await this.userInfoService.updateUserInfo(
					userId,
					data
				)

				return updatedUserInfo
			} else {
				throw new Error('Invalid signature')
			}
		} catch (error) {
			throw new InternalServerErrorException(`Ошибка при подключении кошелька Ton: ${error}`)
		}
	}
}
