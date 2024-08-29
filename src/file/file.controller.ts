import {
	Controller,
	Get,
	HttpCode,
	HttpException,
	HttpStatus,
	Param,
	Post,
	Query,
	Res,
	UploadedFiles,
	UseInterceptors
} from '@nestjs/common'

import { Response } from 'express'
import { FileService } from './file.service'
import { FilesInterceptor } from '@nestjs/platform-express'
import { PublicRoute } from 'src/auth/decorators/public-route.decorator'
import {
	ApiBearerAuth,
	ApiBody,
	ApiConsumes,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags
} from '@nestjs/swagger'
import { join } from 'path'


@Controller('files')
@ApiTags('files')
@ApiBearerAuth('access-token')
export class FileController {
	constructor(private readonly fileService: FileService) {}

	@Post()
	@HttpCode(200)
	@UseInterceptors(FilesInterceptor('files'))
	@PublicRoute()
	@ApiOperation({
		summary: 'Upload files',
		description: 'Uploads files to the specified folder.'
	})
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'List of files to upload',
		required: true,
		schema: {
			type: 'object',
			properties: {
				files: {
					type: 'array',
					items: {
						type: 'string',
						format: 'binary'
					}
				}
			}
		}
	})
	@ApiQuery({
		name: 'folder',
		required: false,
		description: 'Destination folder for uploaded files'
	})
	@ApiResponse({
		status: 200,
		description: 'Files uploaded successfully',
		example: { url: '/uploads/folder/file.png', name: 'file.png' }
	})
	@ApiResponse({ status: 400, description: 'Bad Request' })
	async uploadFile(
		@UploadedFiles() files: Express.Multer.File[],
		@Query('folder') folder?: string
	) {
		return this.fileService.saveFiles(files, folder)
	}

	@Get('download/:filename')
	@PublicRoute()
	async downloadFile(
		@Param('filename') filename: string,
		@Res() res: Response
	) {
		try {
			const filePath = join(__dirname, '..', '..', 'uploads', 'projects', filename)

			res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

			return res.sendFile(filePath)
		} catch (err) {
			throw new HttpException('File not found', HttpStatus.NOT_FOUND)
		}
	}
}
