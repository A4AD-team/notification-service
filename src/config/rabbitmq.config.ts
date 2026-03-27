import { registerAs } from '@nestjs/config';

export default registerAs('rabbitmq', () => ({
  uri: process.env.RABBITMQ_URI || 'amqp://guest:guest@localhost:5672',
  exchange: {
    name: 'notifications',
    type: 'topic',
  },
  queue: {
    name: 'notification-events',
    options: {
      durable: true,
    },
  },
  routingKey: {
    commentCreated: 'comment.created',
    commentLiked: 'comment.liked',
    postLiked: 'post.liked',
    mentionCreated: 'mention.created',
  },
}));
