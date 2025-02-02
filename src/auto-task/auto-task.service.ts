import {
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from '@nestjs/common'
import {
	AutoTask,
	AutoTaskApplication,
	AutoTaskType,
	TransactionType,
	User,
	VerificationMethod
} from '@prisma/client'
import { CreateTransactionDto } from 'src/transaction/dto/transaction.dto'
import { TransactionService } from 'src/transaction/transaction.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { Decimal } from '@prisma/client/runtime/library'
import { TaskStatusResponse } from './dto/task-status.dto'

@Injectable()
export class AutoTaskService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly transactionService: TransactionService
	) {}

	async getAllAutoTasks(userId: number): Promise<AutoTask[]> {
		return await this.prisma.autoTask.findMany({
			include: {
				autoTaskApplication: {
					where: {
						userId: userId
					}
				}
			}
		})
	}

	async getAutoTaskById(id: number): Promise<AutoTask | null> {
		return await this.prisma.autoTask.findUnique({
			where: { id },
			include: { autoTaskApplication: true }
		})
	}

	async claimTask(taskId: number, userId: number): Promise<AutoTaskApplication> {
		const task = await this.prisma.autoTask.findFirst({
			where: { id: taskId }
		})

		if (!task) {
			throw new NotFoundException('Task not found')
		}

		const existingApplication = await this.prisma.autoTaskApplication.findFirst({
			where: {
				userId,
				taskId
			}
		})

		await this.verifyTaskCompletion(task, existingApplication, userId)

		const updatedApplication = await this.prisma.$transaction(async prisma => {
			let application

			if (existingApplication) {
				application = await prisma.autoTaskApplication.update({
					where: { id: existingApplication.id },
					data: {
						isConfirmed: true,
						lastCompletedAt: new Date()
					}
				})
			} else {
				application = await prisma.autoTaskApplication.create({
					data: {
						userId,
						taskId,
						isConfirmed: true,
						lastCompletedAt: new Date()
					}
				})
			}

			const createTransactionDto: CreateTransactionDto = {
				taskId: application.taskId,
				toUserId: userId,
				amount: task.reward,
				type: TransactionType.SYSTEM
			}

			await this.transactionService.createTransaction(createTransactionDto)

			return application
		})

		return updatedApplication
	}

	private async verifyTaskCompletion(
		task: AutoTask,
		application: AutoTaskApplication | null,
		userId: number
	): Promise<void> {
		switch (task.verificationMethod) {
			case VerificationMethod.DAILY_CHECK:
				await this.verifyDailyCheck(application)
				break
			case VerificationMethod.WALLET_VERIFICATION:
				if (application?.isConfirmed) {
					throw new ForbiddenException('Wallet connection reward already claimed.')
				}
				await this.verifyWalletConnection(userId)
				break
			case VerificationMethod.WELCOME:
				await this.verifyWelcomeBonus(application)
				break
			case VerificationMethod.NONE:
				if (application?.isConfirmed) {
					throw new ForbiddenException('Reward already claimed.')
				}
				break
		}
	}

	private async verifyDailyCheck(application: AutoTaskApplication | null): Promise<void> {
		if (application?.lastCompletedAt) {
			const lastComplete = new Date(application.lastCompletedAt)
			const now = new Date()
			
			if (
				lastComplete.getDate() === now.getDate() &&
				lastComplete.getMonth() === now.getMonth() &&
				lastComplete.getFullYear() === now.getFullYear()
			) {
				throw new ForbiddenException('Daily task already completed today.')
			}
		}
	}

	private async verifyWalletConnection(userId: number): Promise<void> {
		const userInfo = await this.prisma.userInfo.findFirst({
			where: { userId }
		})

		if (!userInfo) {
			throw new NotFoundException('User info not found')
		}

		if (!userInfo.tonWalletAddress) {
			throw new ForbiddenException('TON wallet not connected.')
		}

		const existingWalletTask = await this.prisma.autoTaskApplication.findFirst({
			where: {
				userId,
				task: {
					taskType: AutoTaskType.WALLET_CONNECT
				},
				isConfirmed: true
			}
		})

		if (existingWalletTask) {
			throw new ForbiddenException('Wallet connection reward already claimed.')
		}
	}

	private async verifyWelcomeBonus(application: AutoTaskApplication | null): Promise<void> {
		if (application?.isConfirmed) {
			throw new ForbiddenException('Welcome bonus already claimed.')
		}
	}

	async getTaskStatus(userId: number): Promise<TaskStatusResponse[]> {
		const user = await this.prisma.user.findUnique({
			where: { id: userId }
		})

		if (!user) {
			throw new NotFoundException('User not found')
		}

		const tasks = await this.prisma.autoTask.findMany({
			include: {
				autoTaskApplication: {
					where: { userId }
				}
			}
		})

		return tasks.map(task => ({
			taskId: task.id,
			taskType: task.taskType as AutoTaskType,
			isCompleted: task.autoTaskApplication.length > 0 && task.autoTaskApplication[0].isConfirmed,
			lastCompletedAt: task.autoTaskApplication[0]?.lastCompletedAt || null,
			canBeClaimed: this.canTaskBeClaimed(task, task.autoTaskApplication[0])
		}))
	}

	private canTaskBeClaimed(task: AutoTask, application?: AutoTaskApplication): boolean {
		if (!application) return true
		
		switch (task.taskType) {
			case AutoTaskType.DAILY_CHECK:
				if (!application.lastCompletedAt) return true
				const lastComplete = new Date(application.lastCompletedAt)
				const now = new Date()
				return !(
					lastComplete.getDate() === now.getDate() &&
					lastComplete.getMonth() === now.getMonth() &&
					lastComplete.getFullYear() === now.getFullYear()
				)
			case AutoTaskType.WELCOME_BONUS:
			case AutoTaskType.WALLET_CONNECT:
				return !application.isConfirmed
			default:
				return !application.isConfirmed
		}
	}

	async newTransaction(amount: Decimal, userId: number) {
		await this.transactionService.createTransaction({ type: "SYSTEM", toUserId: userId, amount: amount })
	
		return {
			isConfirmed: true
		}
	}

	async getAutoTasksByCategory(category: string): Promise<AutoTask[]> {
		const tasks = await this.prisma.autoTask.findMany({
			where: {
				AutoTaskCategory: {
					name: category
				}
			},
			include: {
				autoTaskApplication: true,
				AutoTaskCategory: true
			}
		});

		if (!tasks || tasks.length === 0) {
			throw new NotFoundException(`Tasks for category ${category} not found`);
		}

		return tasks;
	}
}
