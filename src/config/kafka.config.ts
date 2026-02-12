import { registerAs } from '@nestjs/config';

export default registerAs('kafka', () => ({
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  clientId: process.env.KAFKA_CLIENT_ID || 'notification-service',
  groupId: process.env.KAFKA_GROUP_ID || 'notification-service-group',
  retry: {
    retries: parseInt(process.env.KAFKA_RETRY_RETRIES || '5', 10),
    initialRetryTime: parseInt(
      process.env.KAFKA_RETRY_INITIAL_TIME || '300',
      10,
    ),
  },
}));
