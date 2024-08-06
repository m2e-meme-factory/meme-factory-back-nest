import {
	Injectable,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { parse, validate } from '@telegram-apps/init-data-node'
import { UserService } from 'src/user/user.service'

@Injectable()
export class AuthService {
	constructor(
		private readonly userService: UserService,
		private jwtService: JwtService
	) {}
	async login(initData: string) {
		const botToken = process.env.BOT_TOKEN

		try {
			validate(initData, botToken, {
				expiresIn: 300
			})

			const parsedData = parse(initData)
			const user = await this.userService.findOrCreateUser(
				parsedData.user.id,
				parsedData.user.username
			)
			const payload = { id: user.id }

			return {
				user: user,
				token: await this.jwtService.signAsync(payload)
			}
		} catch (e) {
			throw new UnauthorizedException()
		}
	}

	async getUserById(id: number) {
		const user = await this.userService.getUserById(id)

		if (!user) {
			throw new NotFoundException()
		}

		return user
	}
}
