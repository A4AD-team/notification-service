import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  INotificationChannel,
  InAppNotificationData,
} from './notification-channel.interface';
import { NotificationConfig } from '../../config/configuration.schema';

export interface InAppNotification {
  id: string;
  userId: string;
  title?: string;
  message: string;
  type: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  data?: Record<string, any>;
}

@Injectable()
export class InAppChannel implements INotificationChannel {
  private readonly logger = new Logger(InAppChannel.name);
  private redis: Redis;

  constructor(
    private readonly configService: ConfigService<NotificationConfig>,
  ) {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    const redisConfig = this.configService.get('redis')!;

    this.redis = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      db: redisConfig.db,
      keyPrefix: redisConfig.keyPrefix,
      maxRetriesPerRequest: 3,
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error', error);
    });
  }

  async send(notification: InAppNotificationData): Promise<boolean> {
    try {
      const inAppNotification: InAppNotification = {
        id: this.generateId(),
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.template,
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: notification.actionUrl,
        data: notification.data,
      };

      // Store in user's notifications list
      const userNotificationsKey = `user:${notification.userId}:notifications`;
      await this.redis.lpush(
        userNotificationsKey,
        JSON.stringify(inAppNotification),
      );

      // Keep only last 100 notifications per user
      await this.redis.ltrim(userNotificationsKey, 0, 99);

      // Store in unread notifications set
      const unreadKey = `user:${notification.userId}:unread`;
      await this.redis.sadd(unreadKey, inAppNotification.id);

      // Set expiration for notifications (30 days)
      await this.redis.expire(userNotificationsKey, 30 * 24 * 60 * 60);
      await this.redis.expire(unreadKey, 30 * 24 * 60 * 60);

      this.logger.log(
        `In-app notification sent to user ${notification.userId}, notificationId: ${inAppNotification.id}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send in-app notification to user ${notification.userId}`,
        error,
      );
      return false;
    }
  }

  async getUserNotifications(
    userId: string,
    limit: number = 50,
  ): Promise<InAppNotification[]> {
    try {
      const userNotificationsKey = `user:${userId}:notifications`;
      const notifications = await this.redis.lrange(
        userNotificationsKey,
        0,
        limit - 1,
      );

      return notifications.map((notification) => JSON.parse(notification));
    } catch (error) {
      this.logger.error(
        `Failed to get notifications for user ${userId}`,
        error,
      );
      return [];
    }
  }

  async getUnreadNotificationsCount(userId: string): Promise<number> {
    try {
      const unreadKey = `user:${userId}:unread`;
      return await this.redis.scard(unreadKey);
    } catch (error) {
      this.logger.error(`Failed to get unread count for user ${userId}`, error);
      return 0;
    }
  }

  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    try {
      const unreadKey = `user:${userId}:unread`;
      const result = await this.redis.srem(unreadKey, notificationId);

      if (result > 0) {
        // Update notification in list
        const userNotificationsKey = `user:${userId}:notifications`;
        const notifications = await this.redis.lrange(
          userNotificationsKey,
          0,
          -1,
        );

        for (let i = 0; i < notifications.length; i++) {
          const notification: InAppNotification = JSON.parse(notifications[i]);
          if (notification.id === notificationId) {
            notification.read = true;
            await this.redis.lset(
              userNotificationsKey,
              i,
              JSON.stringify(notification),
            );
            break;
          }
        }
      }

      return result > 0;
    } catch (error) {
      this.logger.error(
        `Failed to mark notification ${notificationId} as read for user ${userId}`,
        error,
      );
      return false;
    }
  }

  async markAllAsRead(userId: string): Promise<number> {
    try {
      const unreadKey = `user:${userId}:unread`;
      const notificationIds = await this.redis.smembers(unreadKey);

      if (notificationIds.length > 0) {
        // Remove all from unread set
        await this.redis.del(unreadKey);

        // Update all notifications in list
        const userNotificationsKey = `user:${userId}:notifications`;
        const notifications = await this.redis.lrange(
          userNotificationsKey,
          0,
          -1,
        );

        for (let i = 0; i < notifications.length; i++) {
          const notification: InAppNotification = JSON.parse(notifications[i]);
          if (!notification.read) {
            notification.read = true;
            await this.redis.lset(
              userNotificationsKey,
              i,
              JSON.stringify(notification),
            );
          }
        }
      }

      return notificationIds.length;
    } catch (error) {
      this.logger.error(
        `Failed to mark all notifications as read for user ${userId}`,
        error,
      );
      return 0;
    }
  }

  async deleteNotification(
    userId: string,
    notificationId: string,
  ): Promise<boolean> {
    try {
      const userNotificationsKey = `user:${userId}:notifications`;
      const notifications = await this.redis.lrange(
        userNotificationsKey,
        0,
        -1,
      );

      for (let i = 0; i < notifications.length; i++) {
        const notification: InAppNotification = JSON.parse(notifications[i]);
        if (notification.id === notificationId) {
          await this.redis.lrem(userNotificationsKey, 1, notifications[i]);

          // Also remove from unread set if present
          const unreadKey = `user:${userId}:unread`;
          await this.redis.srem(unreadKey, notificationId);

          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error(
        `Failed to delete notification ${notificationId} for user ${userId}`,
        error,
      );
      return false;
    }
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}
