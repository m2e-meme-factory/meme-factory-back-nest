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
			secret: '0cb7b4f6695e1f4ad93fe4a7150e4db8e3f4a9de01f1007ea3a61a59208e9711', // потом добавить в env
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
