import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  Notification,
  NotificationChannel,
} from '../entities/notification.entity';
import {
  notificationTemplates,
  renderTemplate,
} from '../templates/notification.templates';

@Injectable()
export class InAppChannel {
  private readonly logger = new Logger(InAppChannel.name);

  constructor(
    @InjectQueue('notifications')
    private readonly notificationsQueue: Queue,
  ) {}

  async send(notification: Notification): Promise<void> {
    try {
      const template = notificationTemplates[notification.type];
      if (!template) {
        this.logger.warn(
          `No template found for notification type: ${notification.type}`,
        );
        return;
      }

      const message = renderTemplate(template.inAppMessage, notification.data);

      // Add to Redis list for real-time delivery
      await this.notificationsQueue.add(
        'in-app-delivery',
        {
          userId: notification.userId,
          notificationId: notification.id,
          type: notification.type,
          message,
          data: notification.data,
          createdAt: notification.createdAt,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );

      this.logger.debug(
        `In-app notification queued for user ${notification.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue in-app notification: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  supports(channel: NotificationChannel): boolean {
    return channel === NotificationChannel.IN_APP;
  }
}
