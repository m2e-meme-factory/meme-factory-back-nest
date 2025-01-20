import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { TransactionService } from 'src/transaction/transaction.service'
import { UpdateUserInfoDto } from 'src/user-info/dto/user-info.dto'
import { UserInfoService } from 'src/user-info/user-info.service'
import { Address } from 'ton-core'
import { Decimal } from '@prisma/client/runtime/library'

@Injectable()
export class TonService {
	constructor(
		private readonly userInfoService: UserInfoService, 
		private readonly transactionService: TransactionService) {}

	async connectTonAddress(userId: number, data: UpdateUserInfoDto) {
		try {
			const walletAddress = Address.parse(data.tonWalletAddress)

			const isValid = Address.isAddress(walletAddress)

			if (isValid) {
				const updatedUserInfo = await this.userInfoService.updateUserInfo(
					userId,
					data
				)

				// TODO: Только 1 раз
				await this.transactionService.createTransaction({ type: "SYSTEM", toUserId: userId, amount: new Decimal(5000) })

				return updatedUserInfo
			} else {
				throw new Error('Invalid signature')
			}
		} catch (error) {
			throw new InternalServerErrorException(`Ошибка при подключении кошелька Ton: ${error}`)
		}
	}
}
