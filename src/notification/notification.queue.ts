import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationService } from './notification.service';
import { NotificationStatus } from '@prisma/client';
import { InjectBot } from 'nestjs-telegraf';
import { Markup, Telegraf } from 'telegraf';

@Injectable()
export class NotificationQueue {
  constructor(
    private readonly notificationService: NotificationService,
    @InjectBot() private readonly bot: Telegraf
  ) {}

  errored_ids: string[] = []

  @Cron(CronExpression.EVERY_MINUTE)
  async processNotifications() {
    const pendingNotifications = await this.notificationService.findPendingNotifications();
    const scheduledNotifications = await this.notificationService.findScheduledNotifications();

    const notificationsToSend = [...pendingNotifications, ...scheduledNotifications];

    for (const notification of notificationsToSend) {
      try {
        if (this.errored_ids.includes(notification.userId)) {
          await this.notificationService.updateStatus(notification.id, NotificationStatus.SENT);
        }
        else {
          await this.bot.telegram.sendMessage(notification.userId, notification.message, {
            reply_markup: Markup.inlineKeyboard([
                Markup.button.webApp("Lanuch now", process.env.APP_URL + "/profile")
              ]).reply_markup
          });
          await this.notificationService.updateStatus(notification.id, NotificationStatus.SENT);
        }
      } catch (error) {
        this.errored_ids.push(notification.userId);
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
    const reminderMessage = `
⭐ Do not forget to complete daily tasks!`;
    await this.notificationService.createReminderForAllCreators(reminderMessage);
  }
}
