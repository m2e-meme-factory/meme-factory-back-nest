import {
	Injectable,
	NotFoundException,
	ForbiddenException,
	InternalServerErrorException
} from '@nestjs/common'
import { AutoTask, TransactionType, User, UserRole } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { CreateAutoTaskDto } from './dto/create-auto-task.dto'
import { TransactionService } from 'src/transaction/transaction.service'
import { CreateTransactionDto } from 'src/transaction/dto/transaction.dto'
import { checkUserRole } from 'src/project/project.utils'

@Injectable()
export class AutoTaskService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly transactionService: TransactionService
	) {}

	async getAllAutoTasks(userId?: number): Promise<AutoTask[]> {
		return await this.prisma.autoTask.findMany({
			where: userId ? { userId } : {}
		})
	}

	async getAutoTaskById(id: number): Promise<AutoTask | null> {
		return await this.prisma.autoTask.findUnique({
			where: { id },
			include: { user: true }
		})
	}

	async applyForTask(dto: CreateAutoTaskDto, user: User): Promise<AutoTask> {
		try {
			await checkUserRole(user, UserRole.creator)

			const { title, description, reward, url, userId, taskId, isIntegrated } = dto

			const task = await this.prisma.autoTask.create({
				data: {
					title,
					description,
					reward,
					url,
					taskId,
					userId,
					isIntegrated
				}
			})
			return task
		} catch (error) {
			if (error instanceof ForbiddenException) {
				throw new ForbiddenException(error.message)
			} else {
				throw new InternalServerErrorException(`apply for task: ${error}`)
			}
		}
	}

	async claimTask(taskId: number, userId: number): Promise<AutoTask> {
		const task = await this.prisma.autoTask.findFirst({
			where: { id: taskId, userId }
		})

		if (!task) {
			throw new NotFoundException('Task not found')
		}
		if (task.isIntegrated === false) {
			const timeElapsed = new Date().getTime() - task.createdAt.getTime()
			if (timeElapsed < 120 * 1000) {
				throw new ForbiddenException('You cannot claim the reward yet.')
			}
		}

		const updatedTask = await this.prisma.$transaction(async prisma => {
			const confirmedTask = await prisma.autoTask.update({
				where: { id: task.id },
				data: { isConfirmed: true }
			})

			const createTransactionDto: CreateTransactionDto = {
				taskId: confirmedTask.id,
				toUserId: userId,
				amount: task.reward,
				type: TransactionType.SYSTEM
			}

			await this.transactionService.createTransaction(createTransactionDto)

			return confirmedTask
		})

		return updatedTask
	}
}
