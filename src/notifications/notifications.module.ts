import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { InAppChannel } from './channels/in-app.channel';
import { EmailChannel } from './channels/email.channel';
import { PushChannel } from './channels/push.channel';
import { CommentCreatedHandler } from './handlers/comment-created.handler';
import { CommentLikedHandler } from './handlers/comment-liked.handler';
import { PostLikedHandler } from './handlers/post-liked.handler';
import { MentionCreatedHandler } from './handlers/mention-created.handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    BullModule.registerQueue({
      name: 'notifications',
    }),
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: configService.get<string>('kafka.clientId')!,
              brokers: configService.get<string[]>('kafka.brokers')!,
            },
            consumer: {
              groupId: configService.get<string>('kafka.groupId')!,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    InAppChannel,
    EmailChannel,
    PushChannel,
    CommentCreatedHandler,
    CommentLikedHandler,
    PostLikedHandler,
    MentionCreatedHandler,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
