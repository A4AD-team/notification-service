import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  Notification,
  NotificationChannel,
} from '../entities/notification.entity';
import {
  notificationTemplates,
  renderTemplate,
} from '../templates/notification.templates';

@Injectable()
export class EmailChannel {
  private readonly logger = new Logger(EmailChannel.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const emailConfig = this.configService.get('email');

    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth.user
        ? {
            user: emailConfig.auth.user,
            pass: emailConfig.auth.pass,
          }
        : undefined,
    });

    this.transporter.verify((error) => {
      if (error) {
        this.logger.error(
          'Email transporter verification failed:',
          error.message,
        );
      } else {
        this.logger.log('Email transporter is ready');
      }
    });
  }

  async send(notification: Notification, email: string): Promise<void> {
    try {
      const template = notificationTemplates[notification.type];
      if (!template) {
        this.logger.warn(
          `No template found for notification type: ${notification.type}`,
        );
        return;
      }

      const subject = renderTemplate(template.subject, notification.data);
      const html = renderTemplate(template.emailBody, {
        ...notification.data,
        userName: notification.data.userName || 'there',
      });

      const from = this.configService.get('email.from');

      await this.transporter.sendMail({
        from,
        to: email,
        subject,
        html,
      });

      this.logger.debug(
        `Email sent to ${email} for notification ${notification.id}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw error;
    }
  }

  supports(channel: NotificationChannel): boolean {
    return channel === NotificationChannel.EMAIL;
  }
}
