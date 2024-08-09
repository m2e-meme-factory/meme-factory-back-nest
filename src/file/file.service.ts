import { BadRequestException, Injectable } from '@nestjs/common'
import { FileResponse } from './file.interface'
import { path } from 'app-root-path'
import { ensureDir, writeFile } from 'fs-extra'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class FileService {
	// private allowedMimeTypes = [
	// 	'image/png',
	// 	'image/jpeg',
	// 	'image/jpg',
	// 	'image/gif',
	// 	'image/bmp',
	// 	'image/webp',
	// ]
	private maxFileSize = 25 * 1024 * 1024 // 25 MB

	async saveFiles(
		files: Express.Multer.File[],
		folder: string = 'default'
	): Promise<FileResponse[]> {
		const uploadFolder = `${path}/uploads/${folder}`
		await ensureDir(uploadFolder)

		const res: FileResponse[] = await Promise.all(
			files.map(async file => {
				// if (!this.allowedMimeTypes.includes(file.mimetype)) {
				// 	throw new BadRequestException(
				// 		`Invalid file type: ${file.originalname}. Only image files are allowed.`
				// 	)
				// }

				if (file.size > this.maxFileSize) {
					throw new BadRequestException(
						`File is too large: ${file.originalname}. Maximum size is 25MB.`
					)
				}
				const uniqueName = `${uuidv4()}_${file.originalname}`

				await writeFile(`${uploadFolder}/${uniqueName}`, file.buffer)

				return {
					url: `/uploads/${folder}/${uniqueName}`,
					name: uniqueName
				}
			})
		)

		return res
	}
}
