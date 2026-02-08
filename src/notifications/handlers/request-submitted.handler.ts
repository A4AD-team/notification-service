import { Injectable } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  Payload,
  KafkaContext,
} from '@nestjs/microservices';
import { RequestSubmittedEvent } from '../dto/kafka-event.dto';
import { BaseKafkaEventHandler } from './base-kafka-event.handler';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class RequestSubmittedHandler extends BaseKafkaEventHandler {
  constructor(notificationsService: NotificationsService) {
    super(notificationsService);
  }
  async handleEvent(
    event: RequestSubmittedEvent,
    context: KafkaContext,
  ): Promise<void> {
    this.logger.log(
      `Processing request.submitted event for request: ${event.requestId}`,
    );

    try {
      // Send notifications to all approvers
      for (const approverId of event.approvers) {
        await this.notificationsService.sendNotification({
          userId: approverId,
          type: 'email',
          template: 'request-submitted',
          data: {
            requestId: event.requestId,
            initiatorId: event.initiatorId,
            approverId,
            timestamp: event.timestamp,
            ...event.payload,
          },
        });

        // Send in-app notification
        await this.notificationsService.sendNotification({
          userId: approverId,
          type: 'in_app',
          template: 'request-submitted',
          data: {
            requestId: event.requestId,
            message: 'Требуется ваше согласование',
            timestamp: event.timestamp,
          },
        });
      }

      // Send confirmation to initiator
      await this.notificationsService.sendNotification({
        userId: event.initiatorId,
        type: 'email',
        template: 'request-submitted-confirmation',
        data: {
          requestId: event.requestId,
          timestamp: event.timestamp,
          approversCount: event.approvers.length,
        },
      });

      await this.commitOffset(context);

      this.logger.log(
        `Successfully processed request.submitted event for request: ${event.requestId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process request.submitted event for request: ${event.requestId}`,
        error,
      );
      throw error;
    }
  }

  @EventPattern('request.submitted')
  async handleRequestSubmitted(
    @Payload() event: RequestSubmittedEvent,
    @Ctx() context: KafkaContext,
  ) {
    await this.handleEvent(event, context);
  }
}
