import { Injectable } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  Payload,
  KafkaContext,
} from '@nestjs/microservices';
import { RequestCreatedEvent } from '../dto/kafka-event.dto';
import { BaseKafkaEventHandler } from './base-kafka-event.handler';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class RequestCreatedHandler extends BaseKafkaEventHandler {
  constructor(notificationsService: NotificationsService) {
    super(notificationsService);
  }

  async handleEvent(
    event: RequestCreatedEvent,
    context: KafkaContext,
  ): Promise<void> {
    this.logger.log(
      `Processing request.created event for request: ${event.requestId}`,
    );

    try {
      // Send notification to initiator
      await this.notificationsService.sendNotification({
        userId: event.initiatorId,
        type: 'email',
        template: 'request-created',
        data: {
          requestId: event.requestId,
          initiatorId: event.initiatorId,
          timestamp: event.timestamp,
          ...event.payload,
        },
      });

      // Send in-app notification to initiator
      await this.notificationsService.sendNotification({
        userId: event.initiatorId,
        type: 'in_app',
        template: 'request-created',
        data: {
          requestId: event.requestId,
          message: 'Ваша заявка успешно создана',
          timestamp: event.timestamp,
        },
      });

      // Commit offset after successful processing
      await this.commitOffset(context);

      this.logger.log(
        `Successfully processed request.created event for request: ${event.requestId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process request.created event for request: ${event.requestId}`,
        error,
      );
      throw error;
    }
  }

  @EventPattern('request.created')
  async handleRequestCreated(
    @Payload() event: RequestCreatedEvent,
    @Ctx() context: KafkaContext,
  ) {
    await this.handleEvent(event, context);
  }
}
