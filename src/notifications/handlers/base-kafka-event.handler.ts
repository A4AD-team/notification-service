import { Logger } from '@nestjs/common';
import { KafkaContext } from '@nestjs/microservices';
import { BaseKafkaEvent } from '../dto/kafka-event.dto';
import { NotificationsService } from '../notifications.service';

export abstract class BaseKafkaEventHandler {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly notificationsService: NotificationsService) {}

  abstract handleEvent(
    event: BaseKafkaEvent,
    context: KafkaContext,
  ): Promise<void>;

  protected async commitOffset(context: KafkaContext): Promise<void> {
    const consumer = context.getConsumer();
    const topic = context.getTopic();
    const partition = context.getPartition();
    const message = context.getMessage();
    const offset = message.offset;

    if (consumer && topic && partition !== undefined && offset) {
      await consumer.commitOffsets([
        {
          topic,
          partition,
          offset: (Number(offset) + 1).toString(),
        },
      ]);
    }
  }
}
