import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)
	app.enableCors({
		origin: ['https://127.0.0.1:5173'],
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE'
	})
	const config = new DocumentBuilder()
		.setTitle('m2e factory')
		.setDescription('API docs for m2e factory')
		.setVersion('1.0')
		.build()
	const document = SwaggerModule.createDocument(app, config)
	SwaggerModule.setup('api', app, document)

	await app.listen(3000)
}
bootstrap()
