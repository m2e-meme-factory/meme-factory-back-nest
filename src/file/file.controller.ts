import {
	Controller,
	HttpCode,
	Post,
	Query,
	UploadedFiles,
	UseInterceptors
} from '@nestjs/common'
import { FileService } from './file.service'
import { FilesInterceptor } from '@nestjs/platform-express'
import { PublicRoute } from 'src/auth/decorators/public-route.decorator'

@Controller('files')
export class FileController {
	constructor(private readonly fileService: FileService) {}

	@Post()
	@HttpCode(200)
	@UseInterceptors(FilesInterceptor('files'))
	@PublicRoute()
	async uploadFile(
		@UploadedFiles() files: Express.Multer.File[],
		@Query('folder') folder?: string
	) {
		return this.fileService.saveFiles(files, folder)
	}
}
