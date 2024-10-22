import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationService } from './notification.service';
import { NotificationStatus } from '@prisma/client';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Injectable()
export class NotificationQueue {
  constructor(
    private readonly notificationService: NotificationService,
    @InjectBot() private readonly bot: Telegraf
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processNotifications() {
    const pendingNotifications = await this.notificationService.findPendingNotifications();
    const scheduledNotifications = await this.notificationService.findScheduledNotifications();

    const notificationsToSend = [...pendingNotifications, ...scheduledNotifications];

    for (const notification of notificationsToSend) {
      try {
        await this.bot.telegram.sendMessage(notification.userId, notification.message);
        await this.notificationService.updateStatus(notification.id, NotificationStatus.SENT);
      } catch (error) {
        if (error.message.includes('bot was blocked by the user')) {
          await this.notificationService.updateStatus(notification.id, NotificationStatus.ERRORED);
        } else {
          console.error('Error sending notification:', error);
        }
      }
    }
  }

  @Cron('0 12 */2 * *')
  async sendCreatorReminders() {
    const reminderMessage = 'Не забудьте выполнить ваши задачи в проектах!';
    await this.notificationService.createReminderForAllCreators(reminderMessage);
  }
}
