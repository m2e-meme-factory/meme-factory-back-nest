import { Injectable } from '@nestjs/common'
import { FileResponse } from './file.interface'
import { path } from 'app-root-path'
import { ensureDir, writeFile } from 'fs-extra'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class FileService {
	private allowedMimeTypes = [
		'image/png',
		'image/jpeg',
		'image/jpg',
		'image/gif',
		'image/bmp',
		'image/webp',
        'application/pdf', // PDF
        'application/msword', // DOC
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
        'audio/mpeg', // MP3
        'video/mp4', // MP4
        'video/x-msvideo', // AVI
	]
	private maxFileSize = 25 * 1024 * 1024 // 25 MB

	async saveFiles(
		files: Express.Multer.File[],
		folder: string = 'default'
	): Promise<FileResponse[]> {
		const uploadFolder = `${path}/uploads/${folder}`
		await ensureDir(uploadFolder)

		const res: FileResponse[] = await Promise.all(
			files.map(async file => {
				
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
