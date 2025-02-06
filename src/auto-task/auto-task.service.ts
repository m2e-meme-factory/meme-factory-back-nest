import {
  Injectable,
} from '@nestjs/common'
import {
  TransactionType,
} from '@prisma/client'
import { TransactionService } from 'src/transaction/transaction.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { Decimal } from '@prisma/client/runtime/library'
import { ALL_AUTOTASKS } from 'src/shared/autoTasks'

@Injectable()
export class AutoTaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionService: TransactionService,
  ) { }

  // Метод для получения статуса всех задач для пользователя
  async getAllTasksStatus(userId: number): Promise<
    {
      name: string;
      reward: number;
      isClaimed: boolean;
    }[]
  > {
    const claims = await this.prisma.autoTaskClaims.findMany({
      where: { userId },
    });

    const checkinClaim = await this.isCheckinCompletedToday(userId);
    const friendsClaimed = await this.isFriendsClaimed(userId);

    return ALL_AUTOTASKS.map((task) => {
      const claim = claims.find((c) => c.taskName === task.name);

      if (task.name === 'checkin' && !checkinClaim)
        return {
          name: task.name,
          reward: task.reward,
          isClaimed: false,
        };

      if (task.name === 'friend-invite' && friendsClaimed)
        return {
          name: task.name,
          reward: task.reward,
          isClaimed: true,
        }

      return {
        name: task.name,
        reward: task.reward,
        isClaimed: claim ? claim.isConfirmed : false,
      };
    });
  }

  // Метод для проверки, была ли задача 'checkin' выполнена сегодня
  private async isCheckinCompletedToday(userId: number): Promise<boolean> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const checkinClaim = await this.prisma.autoTaskClaims.findFirst({
      where: {
        userId,
        taskName: 'checkin',
        lastCompletedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(startOfDay, endOfDay, checkinClaim)

    return !!checkinClaim; // Возвращает true, если задача 'checkin' была выполнена сегодня
  }

  private async isFriendsClaimed(userId: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return false;

    const invitedUsers = await this.prisma.user.findMany({
      where: {
        inviterRefCode: user.refCode
      }
    })

    return invitedUsers.length > 0
  }

  // Метод для выполнения задачи
  async claimAutoTaskByName(taskName: string, userId: number): Promise<boolean> {
    const task = ALL_AUTOTASKS.find((t) => t.name === taskName);

    console.log(taskName, task, ALL_AUTOTASKS)

    if (!task) {
      throw new Error('Task not found');
    }

    // Проверяем, существует ли уже выполненная задача
    const existingClaim = await this.prisma.autoTaskClaims.findFirst({
      where: {
        userId,
        taskName: taskName,
        isConfirmed: true,
      },
    });

    // Если задача — 'checkin', проверяем, была ли она выполнена сегодня
    if (taskName === 'checkin') {
      const isCheckinDoneToday = await this.isCheckinCompletedToday(userId);
      if (isCheckinDoneToday) {
        return false; // Задача 'checkin' уже выполнена сегодня
      }
    }
    if (taskName === "friend-invite") {
      return false;
    }
    else if (existingClaim) {
      return false;
    }

    let claim = existingClaim

    if (existingClaim) {
      claim = await this.prisma.autoTaskClaims.update({
        where: {
          userId_taskName: {
            userId,
            taskName: taskName,
          },
        },
        data: {
          isConfirmed: true,
          lastCompletedAt: new Date(),
        },
      });
    }
    else {
      claim = await this.prisma.autoTaskClaims.create({
        data: {
          userId: userId,
          taskName: taskName,
          isConfirmed: true,
          lastCompletedAt: new Date(),
        },
      });
    }

    // Создаем транзакцию для пополнения средств пользователя
    await this.transactionService.createTransaction({
      taskId: claim.id,
      toUserId: userId,
      amount: new Decimal(task.reward),
      type: TransactionType.SYSTEM,
    });

    await this.transactionService.createReferalTransaction(claim.id, userId, task.reward);

    return true; // Задача успешно выполнена
  }
}