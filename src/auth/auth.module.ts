import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { APP_GUARD } from '@nestjs/core'
import { AuthGuard } from './auth.guard'
import { UserService } from 'src/user/user.service'

@Module({
	providers: [
		AuthService,
    UserService,
		{
			provide: APP_GUARD,
			useClass: AuthGuard
		}
	],
	controllers: [AuthController]
})
export class AuthModule {}
