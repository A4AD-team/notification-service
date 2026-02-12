import { Module, Logger, OnApplicationShutdown, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  Consumer,
  Kafka,
  EachMessagePayload,
  type Consumer as ConsumerType,
} from 'kafkajs';
import { CommentCreatedHandler } from '../notifications/handlers/comment-created.handler';
import { CommentLikedHandler } from '../notifications/handlers/comment-liked.handler';
import { PostLikedHandler } from '../notifications/handlers/post-liked.handler';
import { MentionCreatedHandler } from '../notifications/handlers/mention-created.handler';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'KAFKA_CONSUMER',
      useFactory: (
        configService: ConfigService,
        commentCreatedHandler: CommentCreatedHandler,
        commentLikedHandler: CommentLikedHandler,
        postLikedHandler: PostLikedHandler,
        mentionCreatedHandler: MentionCreatedHandler,
      ) => {
        const logger = new Logger('KafkaConsumer');
        const kafka = new Kafka({
          clientId: configService.get<string>('kafka.clientId')!,
          brokers: configService.get<string[]>('kafka.brokers')!,
          retry: configService.get('kafka.retry'),
        });

        const consumer = kafka.consumer({
          groupId: configService.get<string>('kafka.groupId')!,
        });

        const dlqProducer = kafka.producer();

        const run = async () => {
          await consumer.connect();
          await dlqProducer.connect();

          await consumer.subscribe({
            topics: [
              'comment.created',
              'comment.liked',
              'post.liked',
              'mention.created',
            ],
            fromBeginning: false,
          });

          await consumer.run({
            eachMessage: async (payload: EachMessagePayload) => {
              const { topic, partition, message } = payload;
              const eventData = JSON.parse(message.value?.toString() || '{}');
              const retryCount = message.headers?.['x-retry-count']
                ? parseInt(message.headers['x-retry-count'].toString(), 10)
                : 0;

              logger.debug(`Received message from ${topic}:`, eventData);

              try {
                switch (topic) {
                  case 'comment.created':
                    await commentCreatedHandler.handle(eventData);
                    break;
                  case 'comment.liked':
                    await commentLikedHandler.handle(eventData);
                    break;
                  case 'post.liked':
                    await postLikedHandler.handle(eventData);
                    break;
                  case 'mention.created':
                    await mentionCreatedHandler.handle(eventData);
                    break;
                }
              } catch (error) {
                logger.error(`Error processing message from ${topic}:`, error);

                // Send to DLQ if max retries reached
                if (retryCount >= 3) {
                  await dlqProducer.send({
                    topic: `${topic}.dlq`,
                    messages: [
                      {
                        key: message.key,
                        value: message.value,
                        headers: {
                          ...message.headers,
                          'x-original-topic': topic,
                          'x-error': error.message,
                          'x-timestamp': new Date().toISOString(),
                        },
                      },
                    ],
                  });
                  logger.warn(`Message sent to DLQ: ${topic}.dlq`);
                } else {
                  // Retry with exponential backoff
                  const delay = Math.pow(2, retryCount) * 1000;
                  await dlqProducer.send({
                    topic,
                    messages: [
                      {
                        key: message.key,
                        value: message.value,
                        headers: {
                          ...message.headers,
                          'x-retry-count': (retryCount + 1).toString(),
                        },
                      },
                    ],
                  });
                  logger.debug(`Message scheduled for retry in ${delay}ms`);
                }
              }
            },
          });

          return consumer;
        };

        run().catch((error) => {
          logger.error('Failed to start Kafka consumer:', error);
        });

        return consumer;
      },
      inject: [
        ConfigService,
        CommentCreatedHandler,
        CommentLikedHandler,
        PostLikedHandler,
        MentionCreatedHandler,
      ],
    },
  ],
  exports: ['KAFKA_CONSUMER'],
})
export class KafkaModule implements OnApplicationShutdown {
  private readonly logger = new Logger(KafkaModule.name);

  constructor(
    @Inject('KAFKA_CONSUMER') private readonly consumer: ConsumerType,
  ) {}

  async onApplicationShutdown() {
    this.logger.log('Shutting down Kafka consumer...');
    await this.consumer.disconnect();
    this.logger.log('Kafka consumer disconnected');
  }
}
