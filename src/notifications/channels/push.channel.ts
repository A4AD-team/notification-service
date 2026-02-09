import { Injectable, Logger } from '@nestjs/common';
import {
  INotificationChannel,
  NotificationData,
  PushNotificationData,
} from './notification-channel.interface';

@Injectable()
export class PushChannel implements INotificationChannel {
  private readonly logger = new Logger(PushChannel.name);

  async send(notification: NotificationData): Promise<boolean> {
    const pushNotification = notification as PushNotificationData;
    // TODO: Implement push notifications using FCM/APNs
    this.logger.warn(
      `Push notifications not implemented yet. Would send to device: ${pushNotification.deviceToken}`,
    );

    // Mock implementation for now
    this.logger.log(`Mock push notification sent:`, {
      deviceToken: pushNotification.deviceToken,
      title: pushNotification.title,
      message: pushNotification.message,
      data: pushNotification.data,
    });

    return true;
  }
}
