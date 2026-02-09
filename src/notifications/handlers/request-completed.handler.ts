import { Injectable, Logger } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  Payload,
  KafkaContext,
} from '@nestjs/microservices';
import { RequestCompletedEvent } from '../dto/kafka-event.dto';
import { BaseKafkaEventHandler } from './base-kafka-event.handler';

@Injectable()
export class RequestCompletedHandler extends BaseKafkaEventHandler {
  protected readonly logger = new Logger(RequestCompletedHandler.name);

  async handleEvent(
    event: RequestCompletedEvent,
    context: KafkaContext,
  ): Promise<void> {
    this.logger.log(
      `Processing request.completed event for request: ${event.requestId}`,
    );

    try {
      const isApproved = event.result === 'approved';

      // Send notification to initiator
      await this.notificationsService.sendNotification({
        userId: event.initiatorId,
        type: 'email',
        template: isApproved ? 'request-approved' : 'request-rejected',
        data: {
          requestId: event.requestId,
          result: event.result,
          timestamp: event.timestamp,
          ...event.payload,
        },
      });

      // Send in-app notification to initiator
      await this.notificationsService.sendNotification({
        userId: event.initiatorId,
        type: 'in_app',
        template: isApproved ? 'request-approved' : 'request-rejected',
        data: {
          requestId: event.requestId,
          message: isApproved ? 'Заявка одобрена' : 'Заявка отклонена',
          timestamp: event.timestamp,
        },
      });

      // Send notifications to approvers about completion
      for (const approverId of event.approvers) {
        await this.notificationsService.sendNotification({
          userId: approverId,
          type: 'in_app',
          template: 'request-completed-approver',
          data: {
            requestId: event.requestId,
            result: event.result,
            timestamp: event.timestamp,
          },
        });
      }

      await this.commitOffset(context);

      this.logger.log(
        `Successfully processed request.completed event for request: ${event.requestId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process request.completed event for request: ${event.requestId}`,
        error,
      );
      throw error;
    }
  }

  @EventPattern('request.completed')
  async handleRequestCompleted(
    @Payload() event: RequestCompletedEvent,
    @Ctx() context: KafkaContext,
  ) {
    await this.handleEvent(event, context);
  }
}
