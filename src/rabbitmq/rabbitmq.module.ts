import {
  Module,
  Logger,
  OnApplicationShutdown,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';
import { CommentCreatedHandler } from '../notifications/handlers/comment-created.handler';
import { CommentLikedHandler } from '../notifications/handlers/comment-liked.handler';
import { PostLikedHandler } from '../notifications/handlers/post-liked.handler';
import { MentionCreatedHandler } from '../notifications/handlers/mention-created.handler';

@Injectable()
export class RabbitMQConsumerService implements OnApplicationShutdown {
  private readonly logger = new Logger(RabbitMQConsumerService.name);
  private connection: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly commentCreatedHandler: CommentCreatedHandler,
    private readonly commentLikedHandler: CommentLikedHandler,
    private readonly postLikedHandler: PostLikedHandler,
    private readonly mentionCreatedHandler: MentionCreatedHandler,
  ) {}

  async connect(): Promise<void> {
    const uri =
      this.configService.get<string>('rabbitmq.uri') ||
      'amqp://guest:guest@localhost:5672';
    const exchangeName = 'notifications';

    try {
      this.connection = await amqplib.connect(uri);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(exchangeName, 'topic', {
        durable: true,
      });
      await this.channel.assertExchange('comments', 'topic', { durable: true });
      await this.channel.assertExchange('posts', 'topic', { durable: true });

      const queues = [
        {
          name: 'notification-comment-created',
          exchange: 'comments',
          routingKey: 'comment.created',
        },
        {
          name: 'notification-comment-liked',
          exchange: 'comments',
          routingKey: 'comment.liked',
        },
        {
          name: 'notification-post-liked',
          exchange: 'posts',
          routingKey: 'post.liked',
        },
        {
          name: 'notification-mention-created',
          exchange: 'comments',
          routingKey: 'mention.created',
        },
      ];

      for (const queue of queues) {
        await this.channel.assertQueue(queue.name, { durable: true });
        await this.channel.bindQueue(
          queue.name,
          queue.exchange,
          queue.routingKey,
        );
      }

      await this.setupConsumers();

      this.logger.log('RabbitMQ consumer connected and ready');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  private async setupConsumers(): Promise<void> {
    if (!this.channel) return;

    const channel = this.channel;

    await channel.consume('notification-comment-created', async (msg) => {
      if (msg) {
        this.logger.debug(
          `Received comment.created: ${msg.content.toString()}`,
        );
        try {
          const data = JSON.parse(msg.content.toString());
          await this.commentCreatedHandler.handle(data);
          channel.ack(msg);
        } catch (error) {
          this.logger.error('Error processing comment.created:', error);
          channel.nack(msg, false, true);
        }
      }
    });

    await channel.consume('notification-comment-liked', async (msg) => {
      if (msg) {
        this.logger.debug(`Received comment.liked: ${msg.content.toString()}`);
        try {
          const data = JSON.parse(msg.content.toString());
          await this.commentLikedHandler.handle(data);
          channel.ack(msg);
        } catch (error) {
          this.logger.error('Error processing comment.liked:', error);
          channel.nack(msg, false, true);
        }
      }
    });

    await channel.consume('notification-post-liked', async (msg) => {
      if (msg) {
        this.logger.debug(`Received post.liked: ${msg.content.toString()}`);
        try {
          const data = JSON.parse(msg.content.toString());
          await this.postLikedHandler.handle(data);
          channel.ack(msg);
        } catch (error) {
          this.logger.error('Error processing post.liked:', error);
          channel.nack(msg, false, true);
        }
      }
    });

    await channel.consume('notification-mention-created', async (msg) => {
      if (msg) {
        this.logger.debug(
          `Received mention.created: ${msg.content.toString()}`,
        );
        try {
          const data = JSON.parse(msg.content.toString());
          await this.mentionCreatedHandler.handle(data);
          channel.ack(msg);
        } catch (error) {
          this.logger.error('Error processing mention.created:', error);
          channel.nack(msg, false, true);
        }
      }
    });
  }

  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Shutting down RabbitMQ consumer...');
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.log('RabbitMQ consumer disconnected');
    } catch (error) {
      this.logger.error('Error during RabbitMQ shutdown:', error);
    }
  }
}

@Module({
  providers: [
    RabbitMQConsumerService,
    CommentCreatedHandler,
    CommentLikedHandler,
    PostLikedHandler,
    MentionCreatedHandler,
  ],
  exports: [RabbitMQConsumerService],
})
export class RabbitMQModule {}
