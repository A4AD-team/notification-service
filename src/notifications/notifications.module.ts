import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { EmailChannel } from './channels/email.channel';
import { InAppChannel } from './channels/in-app.channel';
import { PushChannel } from './channels/push.channel';
import { RequestCreatedHandler } from './handlers/request-created.handler';
import { RequestSubmittedHandler } from './handlers/request-submitted.handler';
import { RequestCompletedHandler } from './handlers/request-completed.handler';
import { StageTimeoutHandler } from './handlers/stage-timeout.handler';
import { RateLimitService } from '../common/rate-limit.service';

@Module({
  imports: [ConfigModule],
  providers: [
    NotificationsService,
    EmailChannel,
    InAppChannel,
    PushChannel,
    RateLimitService,
    RequestCreatedHandler,
    RequestSubmittedHandler,
    RequestCompletedHandler,
    StageTimeoutHandler,
  ],
  exports: [NotificationsService, RateLimitService],
})
export class NotificationsModule {}
