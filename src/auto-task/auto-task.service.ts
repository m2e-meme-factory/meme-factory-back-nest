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

	async getAllAutoTasks(userId: number): Promise<AutoTask[]> {
		return await this.prisma.autoTask.findMany({
			include: { autoTaskApplication: {
				where: {
					userId: userId
				}
			} }
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

	async claimTask(taskId: number, userId: number): Promise<AutoTaskApplication> {
		const application = await this.prisma.autoTaskApplication.findFirst({
			where: { taskId, userId },
			include: { task: true }
		});

		if (!application) {
			throw new NotFoundException('Application not found');
		}

		const task = await this.prisma.autoTask.findFirst({ where: { id: taskId } });

		if (!task) {
			throw new NotFoundException('Task not found');
		}

		await this.verifyTaskCompletion(task, application, userId);

		const updatedApplication = await this.prisma.$transaction(async prisma => {
			const confirmedApplication = await prisma.autoTaskApplication.update({
				where: { id: application.id },
				data: { 
					isConfirmed: true,
					lastCompletedAt: new Date()
				}
			});

			const createTransactionDto: CreateTransactionDto = {
				taskId: confirmedApplication.taskId,
				toUserId: userId,
				amount: application.task.reward,
				type: TransactionType.SYSTEM
			};

			await this.transactionService.createTransaction(createTransactionDto);

			return confirmedApplication;
		});

		return updatedApplication;
	}

	private async verifyTaskCompletion(
		task: AutoTask,
		application: AutoTaskApplication,
		userId: number
	): Promise<void> {
		if (application.isConfirmed && task.taskType !== AutoTaskType.DAILY_CHECK) {
			throw new ForbiddenException('Task already claimed.');
		}

		switch (task.verificationMethod) {
			case VerificationMethod.DAILY_CHECK:
				await this.verifyDailyCheck(application);
				break;
			case VerificationMethod.WALLET_VERIFICATION:
				await this.verifyWalletConnection(userId);
				break;
			case VerificationMethod.WELCOME:
				await this.verifyWelcomeBonus(application);
				break;
			case VerificationMethod.NONE:
				break;
		}
	}

	private async verifyDailyCheck(application: AutoTaskApplication): Promise<void> {
		if (application.lastCompletedAt) {
			const lastComplete = new Date(application.lastCompletedAt);
			const now = new Date();
			
			if (
				lastComplete.getDate() === now.getDate() &&
				lastComplete.getMonth() === now.getMonth() &&
				lastComplete.getFullYear() === now.getFullYear()
			) {
				throw new ForbiddenException('Daily task already completed today.');
			}
		}
	}

	private async verifyWalletConnection(userId: number): Promise<void> {
		const userInfo = await this.prisma.userInfo.findFirst({
			where: { userId }
		});

		if (!userInfo) {
			throw new NotFoundException('User info not found');
		}

		if (!userInfo.tonWalletAddress) {
			throw new ForbiddenException('TON wallet not connected.');
		}
	}

	private async verifyWelcomeBonus(application: AutoTaskApplication): Promise<void> {
		if (application.isConfirmed) {
			throw new ForbiddenException('Welcome bonus already claimed.');
		}
	}

	async getTaskStatus(userId: number): Promise<TaskStatusResponse[]> {
		const user = await this.prisma.user.findUnique({
			where: { id: userId }
		});

		if (!user) {
			throw new NotFoundException('User not found');
		}

		const tasks = await this.prisma.autoTask.findMany({
			include: {
				autoTaskApplication: {
					where: { userId }
				}
			}
		});

		return tasks.map(task => ({
			taskId: task.id,
			taskType: task.taskType as AutoTaskType,
			isCompleted: task.autoTaskApplication.length > 0 && task.autoTaskApplication[0].isConfirmed,
			lastCompletedAt: task.autoTaskApplication[0]?.lastCompletedAt || null,
			canBeClaimed: this.canTaskBeClaimed(task, task.autoTaskApplication[0])
		}));
	}

	private canTaskBeClaimed(task: AutoTask, application?: AutoTaskApplication): boolean {
		if (!application) return true;
		
		switch (task.taskType) {
			case AutoTaskType.DAILY_CHECK:
				if (!application.lastCompletedAt) return true;
				const lastComplete = new Date(application.lastCompletedAt);
				const now = new Date();
				return !(
					lastComplete.getDate() === now.getDate() &&
					lastComplete.getMonth() === now.getMonth() &&
					lastComplete.getFullYear() === now.getFullYear()
				);
			case AutoTaskType.WELCOME_BONUS:
				return !application.isConfirmed;
			default:
				return !application.isConfirmed;
		}
	}

	async newTransaction(amount: Decimal, userId: number) {
		await this.transactionService.createTransaction({ type: "SYSTEM", toUserId: userId, amount: amount })
	
		return {
			isConfirmed: true
		}
	}
}
