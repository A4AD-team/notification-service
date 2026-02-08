import { Injectable, Logger } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  Payload,
  KafkaContext,
} from '@nestjs/microservices';
import { StageTimeoutEvent } from '../dto/kafka-event.dto';
import { BaseKafkaEventHandler } from './base-kafka-event.handler';

@Injectable()
export class StageTimeoutHandler extends BaseKafkaEventHandler {
  private readonly logger = new Logger(StageTimeoutHandler.name);

  async handleEvent(
    event: StageTimeoutEvent,
    context: KafkaContext,
  ): Promise<void> {
    this.logger.log(
      `Processing stage.timeout event for request: ${event.requestId}`,
    );

    try {
      // Send timeout notifications to approvers
      for (const approverId of event.approvers) {
        await this.notificationsService.sendNotification({
          userId: approverId,
          type: 'email',
          template: 'stage-timeout',
          data: {
            requestId: event.requestId,
            stageId: event.stageId,
            stageName: event.stageName,
            deadline: event.deadline,
            timestamp: event.timestamp,
          },
        });

        // Send in-app notification
        await this.notificationsService.sendNotification({
          userId: approverId,
          type: 'in_app',
          template: 'stage-timeout',
          data: {
            requestId: event.requestId,
            message: `Время согласования этапа "${event.stageName}" истекло`,
            timestamp: event.timestamp,
          },
        });
      }

      // Send notification to initiator
      await this.notificationsService.sendNotification({
        userId: event.initiatorId,
        type: 'email',
        template: 'stage-timeout-initiator',
        data: {
          requestId: event.requestId,
          stageName: event.stageName,
          deadline: event.deadline,
          timestamp: event.timestamp,
        },
      });

      await this.commitOffset(context);

      this.logger.log(
        `Successfully processed stage.timeout event for request: ${event.requestId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process stage.timeout event for request: ${event.requestId}`,
        error,
      );
      throw error;
    }
  }

  @EventPattern('stage.timeout')
  async handleStageTimeout(
    @Payload() event: StageTimeoutEvent,
    @Ctx() context: KafkaContext,
  ) {
    await this.handleEvent(event, context);
  }
}
