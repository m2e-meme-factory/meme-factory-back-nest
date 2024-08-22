import { Body, Controller, Get, Post, Req } from '@nestjs/common'
import { PublicRoute } from './decorators/public-route.decorator'
import { AuthService } from './auth.service'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

@Controller('auth')
@ApiBearerAuth('access-token')
@ApiTags('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

	@PublicRoute()
	@Post('login')
	async login(@Body() body: { initData: string }) {
        const response = await this.authService.login(body.initData)
		return response
	}

	@Get("me")
    async getCurrentUser(@Req() req: Request & { user: {id: number} }) {
        return await this.authService.getUserById(req.user.id)
    }
}
