import {
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from '@nestjs/common'
import {
	AutoTask,
	AutoTaskApplication,
	TransactionType,
	User
} from '@prisma/client'
import { CreateTransactionDto } from 'src/transaction/dto/transaction.dto'
import { TransactionService } from 'src/transaction/transaction.service'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class AutoTaskService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly transactionService: TransactionService
	) {}

	async getAutoTaskApplications(
		userId?: number,
		taskId?: number
	): Promise<AutoTaskApplication[]> {
		try {
			const whereClause: any = {}

			if (userId) {
				whereClause.userId = userId
			}

			if (taskId) {
				whereClause.taskId = taskId
			}

			const applications = await this.prisma.autoTaskApplication.findMany({
				where: whereClause,
				include: {
					task: true,
					user: true
				}
			})

			return applications
		} catch (error) {
			throw new InternalServerErrorException(
				`Error fetching auto task applications: ${error}`
			)
		}
	}

	async getAllAutoTasks(): Promise<AutoTask[]> {
		return await this.prisma.autoTask.findMany({
			include: { autoTaskApplication: true }
		})
	}

	async getAutoTaskById(id: number): Promise<AutoTask | null> {
		return await this.prisma.autoTask.findUnique({
			where: { id },
			include: { autoTaskApplication: true }
		})
	}

	async applyForTask(taskId: number, user: User): Promise<AutoTaskApplication> {
		try {
			const task = await this.prisma.autoTask.findUnique({
				where: { id: taskId }
			})

			if (!task) {
				throw new NotFoundException('Task not found')
			}

			const existingApplication =
				await this.prisma.autoTaskApplication.findUnique({
					where: { userId_taskId: { userId: user.id, taskId } }
				})

			if (existingApplication) {
				throw new ForbiddenException('You have already applied for this task.')
			}

			const application = await this.prisma.autoTaskApplication.create({
				data: {
					userId: user.id,
					taskId
				}
			})

			return application
		} catch (error) {
			throw new InternalServerErrorException(
				`Error applying for task: ${error}`
			)
		}
	}

	async claimTask(
		taskId: number,
		userId: number
	): Promise<AutoTaskApplication> {
		const application = await this.prisma.autoTaskApplication.findFirst({
			where: { taskId, userId },
			include: { task: true }
		})

		const task = await this.prisma.autoTask.findFirst({ where: { id: taskId } })

		if (!application) {
			throw new NotFoundException('Application not found')
		}
		if (application.isConfirmed) {
			throw new ForbiddenException('Task already claimed.')
		}
		if (!task.isIntegrated) {
			const timeElapsed = new Date().getTime() - application.createdAt.getTime()
			if (timeElapsed < 10 * 1000) {
				throw new ForbiddenException('You cannot claim the reward yet.')
			}
		}

		const updatedApplication = await this.prisma.$transaction(async prisma => {
			const confirmedApplication = await prisma.autoTaskApplication.update({
				where: { id: application.id },
				data: { isConfirmed: true }
			})

			const createTransactionDto: CreateTransactionDto = {
				taskId: confirmedApplication.taskId,
				toUserId: userId,
				amount: application.task.reward,
				type: TransactionType.SYSTEM
			}

			await this.transactionService.createTransaction(createTransactionDto)

			return confirmedApplication
		})

		return updatedApplication
	}
}
