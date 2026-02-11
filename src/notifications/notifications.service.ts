import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailChannel } from './channels/email.channel';
import { InAppChannel } from './channels/in-app.channel';
import { PushChannel } from './channels/push.channel';
import { NotificationTemplates } from './templates/notification.templates';
import {
  NotificationData,
  EmailNotificationData,
  InAppNotificationData,
} from './channels/notification-channel.interface';
import { NotificationConfig } from '../config/configuration.schema';

export interface SendNotificationDto extends Omit<NotificationData, 'type'> {
  userId: string;
  type: 'email' | 'in_app' | 'push';
  template: string;
  data: Record<string, any>;
  priority?: 'low' | 'medium' | 'high';
  email?: {
    to: string;
    subject?: string;
  };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly emailChannel: EmailChannel,
    private readonly inAppChannel: InAppChannel,
    private readonly pushChannel: PushChannel,
    private readonly configService: ConfigService<NotificationConfig>,
  ) {}

  async sendNotification(dto: SendNotificationDto): Promise<boolean> {
    try {
      // Get template
      const template = NotificationTemplates.getTemplate(dto.template);
      if (!template) {
        this.logger.error(`Template not found: ${dto.template}`);
        return false;
      }

      // Render template with data
      const renderedTemplate = NotificationTemplates.renderTemplate(
        template,
        dto.data,
      );

      // Send based on type
      switch (dto.type) {
        case 'email':
          return await this.sendEmailNotification(dto, renderedTemplate);

        case 'in_app':
          return await this.sendInAppNotification(dto, renderedTemplate);

        case 'push':
          return await this.sendPushNotification(dto, renderedTemplate);

        default:
          this.logger.error(`Unsupported notification type: ${dto.type}`);
          return false;
      }
    } catch (error) {
      this.logger.error(
        `Failed to send notification: ${JSON.stringify(dto)}`,
        error,
      );
      return false;
    }
  }

  private async sendEmailNotification(
    dto: SendNotificationDto,
    template: any,
  ): Promise<boolean> {
    // TODO: Get user email from user service or database
    const userEmail = dto.email?.to || `${dto.userId}@example.com`;

    const emailData: EmailNotificationData = {
      userId: dto.userId,
      type: 'email',
      template: dto.template,
      data: dto.data,
      to: userEmail,
      subject: dto.email?.subject || template.subject,
      text: template.text,
      html: template.html,
    };

    return await this.emailChannel.send(emailData);
  }

  private async sendInAppNotification(
    dto: SendNotificationDto,
    template: any,
  ): Promise<boolean> {
    const inAppData: InAppNotificationData = {
      userId: dto.userId,
      type: 'in_app',
      template: dto.template,
      data: dto.data,
      title: template.title,
      message: template.message,
    };

    return await this.inAppChannel.send(inAppData);
  }

  private async sendPushNotification(
    dto: SendNotificationDto,
    template: any,
  ): Promise<boolean> {
    // TODO: Get user device token from user service or database
    const deviceToken = 'mock_device_token';

    const pushData = {
      userId: dto.userId,
      type: 'push' as const,
      template: dto.template,
      data: dto.data,
      deviceToken,
      title: template.title || 'A4AD Уведомление',
      message: template.message,
      pushData: {
        requestId: dto.data.requestId,
        type: dto.template,
      },
    };

    return await this.pushChannel.send(pushData);
  }

  // Methods for in-app notifications management
  async getUserNotifications(userId: string, limit: number = 50) {
    return await this.inAppChannel.getUserNotifications(userId, limit);
  }

  async getUnreadNotificationsCount(userId: string): Promise<number> {
    return await this.inAppChannel.getUnreadNotificationsCount(userId);
  }

  async markNotificationAsRead(
    userId: string,
    notificationId: string,
  ): Promise<boolean> {
    return await this.inAppChannel.markAsRead(userId, notificationId);
  }

  async markAllNotificationsAsRead(userId: string): Promise<number> {
    return await this.inAppChannel.markAllAsRead(userId);
  }

  async deleteNotification(
    userId: string,
    notificationId: string,
  ): Promise<boolean> {
    return await this.inAppChannel.deleteNotification(userId, notificationId);
  }

  // Health check methods
  async checkEmailHealth(): Promise<boolean> {
    try {
      // TODO: Implement email health check
      return true;
    } catch (error) {
      this.logger.error('Email health check failed', error);
      return false;
    }
  }

  async checkRedisHealth(): Promise<boolean> {
    try {
      // TODO: Implement Redis health check
      return true;
    } catch (error) {
      this.logger.error('Redis health check failed', error);
      return false;
    }
  }
}
