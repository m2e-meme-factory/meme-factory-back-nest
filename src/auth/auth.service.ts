import { Injectable, UnauthorizedException } from '@nestjs/common'
import { parse, validate } from '@telegram-apps/init-data-node'
import { UserService } from 'src/user/user.service'

@Injectable()
export class AuthService {
    constructor(private readonly userService: UserService) {}
	async login(initData: string) {
		const botToken = '6821067613:AAFgvaeRDSVYP2wpCsgOVXJoTTSFDj5kbDs' // потом заменить на env

		try {
			validate(initData, botToken, {
				expiresIn: 300
			})

			const parsedData = parse(initData)
            const user = await this.userService.findOrCreateUser(parsedData.user.id, parsedData.user.username)

			return {
				user: user,
				token: 'secret-token'
			}
		} catch (e) {
			throw new UnauthorizedException()
		}
	}
}
