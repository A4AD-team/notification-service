import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  INotificationChannel,
  EmailNotificationData,
} from './notification-channel.interface';
import { NotificationConfig } from '../../config/configuration.schema';

@Injectable()
export class EmailChannel implements INotificationChannel {
  private readonly logger = new Logger(EmailChannel.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService<NotificationConfig>,
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const emailConfig = this.configService.get('email')!;

    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass,
      },
      pool: emailConfig.pool,
      maxConnections: emailConfig.maxConnections,
      maxMessages: emailConfig.maxMessages,
    });

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('Email transporter verification failed', error);
      } else {
        this.logger.log('Email transporter is ready');
      }
    });
  }

  async send(notification: EmailNotificationData): Promise<boolean> {
    try {
      const emailConfig = this.configService.get('email')!;

      const mailOptions = {
        from: emailConfig.from,
        to: notification.to,
        subject: notification.subject || this.generateSubject(notification),
        text: notification.text || this.generateTextContent(notification),
        html: notification.html || this.generateHtmlContent(notification),
      };

      const result = await this.transporter.sendMail(mailOptions);

      this.logger.log(
        `Email sent successfully to ${notification.to}, messageId: ${result.messageId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${notification.to}`, error);
      return false;
    }
  }

  private generateSubject(notification: EmailNotificationData): string {
    const subjects: Record<string, string> = {
      'request-created': 'Ваша заявка создана',
      'request-submitted': 'Требуется ваше согласование',
      'request-submitted-confirmation': 'Заявка отправлена на согласование',
      'request-approved': 'Заявка одобрена',
      'request-rejected': 'Заявка отклонена',
      'request-changes-requested': 'Требуется доработка заявки',
      'stage-timeout': 'Истекло время согласования',
      'stage-timeout-initiator': 'Задержка согласования вашей заявки',
      'stage-reminder': 'Напоминание о согласовании',
    };

    return subjects[notification.template] || 'Уведомление A4AD';
  }

  private generateTextContent(notification: EmailNotificationData): string {
    const templates: Record<string, (data: any) => string> = {
      'request-created': (data) =>
        `Ваша заявка №${data.requestId} успешно создана и отправлена на согласование.\n\n` +
        `ID заявки: ${data.requestId}\n` +
        `Дата создания: ${data.timestamp}\n`,

      'request-submitted': (data) =>
        `Требуется ваше согласование заявки №${data.requestId}.\n\n` +
        `ID заявки: ${data.requestId}\n` +
        `Дата подачи: ${data.timestamp}\n`,

      'request-approved': (data) =>
        `Ваша заявка №${data.requestId} одобрена.\n\n` +
        `ID заявки: ${data.requestId}\n` +
        `Дата одобрения: ${data.timestamp}\n`,

      'request-rejected': (data) =>
        `Ваша заявка №${data.requestId} отклонена.\n\n` +
        `ID заявки: ${data.requestId}\n` +
        `Дата отклонения: ${data.timestamp}\n`,

      'stage-timeout': (data) =>
        `Истекло время согласования этапа "${data.stageName}" заявки №${data.requestId}.\n\n` +
        `ID заявки: ${data.requestId}\n` +
        `Этап: ${data.stageName}\n` +
        `Дедлайн: ${data.deadline}\n`,
    };

    const template = templates[notification.template];
    return template
      ? template(notification.data)
      : JSON.stringify(notification.data, null, 2);
  }

  private generateHtmlContent(notification: EmailNotificationData): string {
    const textContent = this.generateTextContent(notification);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>A4AD Уведомление</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>A4AD</h1>
            <p>Система согласования заявок</p>
          </div>
          <div class="content">
            <pre style="white-space: pre-wrap; font-family: inherit;">${textContent}</pre>
          </div>
          <div class="footer">
            <p>Это уведомление отправлено автоматически. Пожалуйста, не отвечайте на него.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
    }
  }
}
