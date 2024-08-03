import { Body, Controller, Get, Post } from '@nestjs/common'
import { PublicRoute } from './decorators/public-route.decorator'
import { AuthService } from './auth.service'

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

	@PublicRoute()
	@Post('login')
	async login(@Body() body: { initData: string }) {
        const response = await this.authService.login(body.initData)
		return response
	}

	@Get('me')
	async getCurrentUser() {}
}
