import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { APP_GUARD } from '@nestjs/core'
import { AuthGuard } from './auth.guard'
import { UserService } from 'src/user/user.service'
import { JwtModule } from '@nestjs/jwt'

@Module({
	imports: [
		JwtModule.register({
			global: true,
			secret: process.env.JWT_SECRET,
			signOptions: { expiresIn: "1h" },
		})
	],
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
