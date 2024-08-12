import {
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { CreateEventDto } from './dto/event.dto'

@Injectable()
export class EventService {
	constructor(private readonly prisma: PrismaService) {}
	async createEvent(data: CreateEventDto) {
		try {
			return await this.prisma.event.create({ data })
		} catch (error) {
			throw new InternalServerErrorException(
				`Ошибка при создании события: ${error.message}`
			)
		}
	}

	async getEventById(id: number) {
		try {
			const event = await this.prisma.event.findUnique({
				where: { id },
				include: { User: true }
			})
			if (!event) {
				throw new NotFoundException(`Событие с ID ${id} не найдено`)
			}
			return event
		} catch (error) {
			throw new InternalServerErrorException(
				`Ошибка при получении события: ${error.message}`
			)
		}
	}

	async getAllEvents() {
		try {
			return await this.prisma.event.findMany({ include: { User: true } })
		} catch (error) {
			throw new InternalServerErrorException(
				`Ошибка при получении всех событий: ${error.message}`
			)
		}
	}

	async getEventsByProjectId(projectId: number) {
		try {
			const events = await this.prisma.event.findMany({
				where: { projectId },
				include: { User: true },
				orderBy: { createdAt: 'asc' }
			})
			if (!events || events.length === 0) {
				throw new NotFoundException(
					`События для проекта с ID ${projectId} не найдены`
				)
			}
			return events
		} catch (error) {
			throw new InternalServerErrorException(
				`Ошибка при получении истории проекта: ${error.message}`
			)
		}
	}
}
