import {
  Injectable,
  Logger,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import {
  Notification,
  NotificationChannel,
  TargetType,
} from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { InAppChannel } from './channels/in-app.channel';
import { EmailChannel } from './channels/email.channel';
import { PushChannel } from './channels/push.channel';
import { ClientKafka } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

export interface NotificationList {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRedis()
    private readonly redis: Redis,
    private readonly inAppChannel: InAppChannel,
    private readonly emailChannel: EmailChannel,
    private readonly pushChannel: PushChannel,
    @Inject('KAFKA_SERVICE')
    private readonly kafkaClient: ClientKafka,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    try {
      // Check idempotency
      if (dto.idempotencyKey) {
        const existing = await this.notificationRepository.findOne({
          where: { idempotencyKey: dto.idempotencyKey },
        });
        if (existing) {
          this.logger.debug(
            `Duplicate notification prevented: ${dto.idempotencyKey}`,
          );
          return existing;
        }
      }

      // Check rate limits
      const rateLimitKey = `rate-limit:${dto.userId}:${dto.channels?.includes('email') ? 'email' : 'in-app'}`;
      const currentCount = await this.redis.incr(rateLimitKey);

      if (currentCount === 1) {
        await this.redis.expire(rateLimitKey, 300); // 5 minutes window
      }

      const maxRequests = dto.channels?.includes('email') ? 20 : 100;
      if (currentCount > maxRequests) {
        this.logger.warn(`Rate limit exceeded for user ${dto.userId}`);
        throw new ConflictException('Rate limit exceeded');
      }

      // Create notification
      const notification = this.notificationRepository.create({
        userId: dto.userId,
        type: dto.type as any,
        actorId: dto.actorId,
        targetId: dto.targetId,
        targetType: dto.targetType as TargetType,
        data: dto.data,
        channels: (dto.channels as NotificationChannel[]) || [
          NotificationChannel.IN_APP,
        ],
        idempotencyKey: dto.idempotencyKey,
      });

      const saved = await this.notificationRepository.save(notification);

      // Send to channels
      await this.sendToChannels(saved);

      // Publish event to Kafka
      await this.publishNotificationSent(saved);

      this.logger.debug(`Notification created: ${saved.id}`);
      return saved;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(
        `Failed to create notification: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to create notification');
    }
  }

  private async sendToChannels(notification: Notification): Promise<void> {
    const channels = notification.channels || [NotificationChannel.IN_APP];

    for (const channel of channels) {
      try {
        switch (channel) {
          case NotificationChannel.IN_APP:
            await this.inAppChannel.send(notification);
            break;
          case NotificationChannel.EMAIL:
            // TODO: Get user email from user service
            await this.emailChannel.send(
              notification,
              notification.data.userEmail || '',
            );
            break;
          case NotificationChannel.PUSH:
            await this.pushChannel.send(notification);
            break;
        }
      } catch (error) {
        this.logger.error(
          `Failed to send to channel ${channel}: ${error.message}`,
        );
        // Continue with other channels even if one fails
      }
    }

    // Update sentAt timestamp
    notification.sentAt = new Date();
    await this.notificationRepository.save(notification);
  }

  private async publishNotificationSent(
    notification: Notification,
  ): Promise<void> {
    try {
      this.kafkaClient.emit('notification.sent', {
        notificationId: notification.id,
        userId: notification.userId,
        type: notification.type,
        channels: notification.channels,
        sentAt: notification.sentAt,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(
        `Failed to publish notification.sent event: ${error.message}`,
      );
    }
  }

  async findAll(
    userId: string,
    options: {
      unreadOnly?: boolean;
      page?: number;
      limit?: number;
      type?: string;
    } = {},
  ): Promise<NotificationList> {
    const { unreadOnly, page = 1, limit = 20, type } = options;

    const where: FindOptionsWhere<Notification> = { userId };

    if (unreadOnly) {
      where.isRead = false;
    }

    if (type) {
      where.type = type as any;
    }

    const [notifications, total] =
      await this.notificationRepository.findAndCount({
        where,
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

    const unreadCount = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });

    return {
      notifications,
      total,
      page,
      limit,
      unreadCount,
    };
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }
}
