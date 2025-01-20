import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Notification, NotificationStatus } from '@prisma/client';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    return this.prisma.notification.create({
      data: createNotificationDto,
    });
  }

  async findPendingNotifications(): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: {
        status: NotificationStatus.PENDING,
        scheduledFor: null,
      },
    });
  }

  async findScheduledNotifications(): Promise<Notification[]> {
    const now = new Date();
    return this.prisma.notification.findMany({
      where: {
        status: NotificationStatus.PENDING,
        scheduledFor: {
          lte: now,
        },
      },
    });
  }

  async updateStatus(id: number, status: NotificationStatus): Promise<void> {
    await this.prisma.notification.update({
      where: { id },
      data: { status },
    });
  }

  async createReminderForAllCreators(message: string): Promise<void> {
    const creators = await this.prisma.user.findMany({
      where: { role: 'creator' }
    });

    const reminders = creators.map(creator => {
      return {        
          userId: creator.telegramId,
          message: message
      }
    }
    )
    const created = await this.prisma.notification.createMany({data: reminders})
  }
}
