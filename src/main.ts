import { NestFactory, Reflector } from '@nestjs/core'
import { AppModule } from './app.module'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AuthGuard } from './auth/auth.guard'
import { JwtService } from '@nestjs/jwt'
import { UserService } from './user/user.service'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)
	app.enableCors({
		origin: '*',
		// origin: ['https://127.0.0.1:5173', 'https://124f-178-185-45-73.ngrok-free.app', 'https://aa00-178-185-45-73.ngrok-free.app', 'https://meme-factory.site'],
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE'
	})
	app.useGlobalGuards(new AuthGuard(app.get(Reflector), app.get(JwtService), app.get(UserService)));

	const config = new DocumentBuilder()
		.setTitle('m2e factory')
		.setDescription('API docs for m2e factory')
		.setVersion('1.0')
		.addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
		.build()
	const document = SwaggerModule.createDocument(app, config)
	SwaggerModule.setup('api', app, document)

	await app.listen(3000)
}
bootstrap()
