import { Injectable, Logger } from '@nestjs/common';
import {
  Notification,
  NotificationChannel,
} from '../entities/notification.entity';
import {
  notificationTemplates,
  renderTemplate,
} from '../templates/notification.templates';

@Injectable()
export class PushChannel {
  private readonly logger = new Logger(PushChannel.name);

  async send(notification: Notification): Promise<void> {
    try {
      const template = notificationTemplates[notification.type];
      if (!template) {
        this.logger.warn(
          `No template found for notification type: ${notification.type}`,
        );
        return;
      }

      // Placeholder for FCM/APNs integration
      // TODO: Implement actual push notification logic
      this.logger.log(
        `[PUSH PLACEHOLDER] Would send push notification to user ${notification.userId}:`,
        {
          title: template.pushTitle,
          body: renderTemplate(template.pushBody || '', notification.data),
          data: {
            notificationId: notification.id,
            type: notification.type,
            targetId: notification.targetId,
            targetType: notification.targetType,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to send push notification: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  supports(channel: NotificationChannel): boolean {
    return channel === NotificationChannel.PUSH;
  }
}
