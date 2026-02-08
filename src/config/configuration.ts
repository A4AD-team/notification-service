import { ConfigFactory } from '@nestjs/config';
import { configSchema, NotificationConfig } from './configuration.schema';

export const configuration: ConfigFactory = () => {
  const config: NotificationConfig = {
    app: {
      port: parseInt(
        process.env.PORT || configSchema.PORT.default.toString(),
        10,
      ),
      nodeEnv: process.env.NODE_ENV || configSchema.NODE_ENV.default,
    },
    kafka: {
      brokers: (
        process.env.KAFKA_BROKERS || configSchema.KAFKA_BROKERS.default
      ).split(','),
      clientId:
        process.env.KAFKA_CLIENT_ID || configSchema.KAFKA_CLIENT_ID.default,
      consumer: {
        groupId:
          process.env.KAFKA_CONSUMER_GROUP_ID ||
          configSchema.KAFKA_CONSUMER_GROUP_ID.default,
      },
      producer: {
        clientId: `${process.env.KAFKA_CLIENT_ID || configSchema.KAFKA_CLIENT_ID.default}-producer`,
      },
      topics: {
        requestCreated: 'request.created',
        requestSubmitted: 'request.submitted',
        requestStageAdvanced: 'request.stage_advanced',
        requestCompleted: 'request.completed',
        requestRejected: 'request.rejected',
        requestChangesRequested: 'request.changes_requested',
        requestResubmitted: 'request.resubmitted',
        requestCancelled: 'request.cancelled',
        stageTimeout: 'stage.timeout',
        stageReminder: 'stage.reminder',
        commentAdded: 'comment.added',
        deadLetter: 'notification.dead_letter',
      },
    },
    redis: {
      host: process.env.REDIS_HOST || configSchema.REDIS_HOST.default,
      port: parseInt(
        process.env.REDIS_PORT || configSchema.REDIS_PORT.default.toString(),
        10,
      ),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(
        process.env.REDIS_DB || configSchema.REDIS_DB.default.toString(),
        10,
      ),
      keyPrefix:
        process.env.REDIS_KEY_PREFIX || configSchema.REDIS_KEY_PREFIX.default,
    },
    email: {
      host: process.env.EMAIL_HOST || configSchema.EMAIL_HOST.default,
      port: parseInt(
        process.env.EMAIL_PORT || configSchema.EMAIL_PORT.default.toString(),
        10,
      ),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
      },
      from: process.env.EMAIL_FROM || configSchema.EMAIL_FROM.default,
      pool: process.env.EMAIL_POOL === 'true',
      maxConnections: parseInt(
        process.env.EMAIL_MAX_CONNECTIONS ||
          configSchema.EMAIL_MAX_CONNECTIONS.default.toString(),
        10,
      ),
      maxMessages: parseInt(
        process.env.EMAIL_MAX_MESSAGES ||
          configSchema.EMAIL_MAX_MESSAGES.default.toString(),
        10,
      ),
    },
    rateLimit: {
      windowMs: parseInt(
        process.env.RATE_LIMIT_WINDOW_MS ||
          configSchema.RATE_LIMIT_WINDOW_MS.default.toString(),
        10,
      ),
      maxEmailsPerWindow: parseInt(
        process.env.RATE_LIMIT_MAX_EMAILS ||
          configSchema.RATE_LIMIT_MAX_EMAILS.default.toString(),
        10,
      ),
      maxInAppPerWindow: parseInt(
        process.env.RATE_LIMIT_MAX_INAPP ||
          configSchema.RATE_LIMIT_MAX_INAPP.default.toString(),
        10,
      ),
    },
    observability: {
      enableTracing: process.env.OBSERVABILITY_ENABLE_TRACING === 'true',
      enableMetrics: process.env.OBSERVABILITY_ENABLE_METRICS === 'true',
      serviceName:
        process.env.OBSERVABILITY_SERVICE_NAME ||
        configSchema.OBSERVABILITY_SERVICE_NAME.default,
      serviceVersion:
        process.env.OBSERVABILITY_SERVICE_VERSION ||
        configSchema.OBSERVABILITY_SERVICE_VERSION.default,
      metricsPort: parseInt(
        process.env.OBSERVABILITY_METRICS_PORT ||
          configSchema.OBSERVABILITY_METRICS_PORT.default.toString(),
        10,
      ),
    },
  };

  return {
    app: config.app,
    kafka: config.kafka,
    redis: config.redis,
    email: config.email,
    rateLimit: config.rateLimit,
    observability: config.observability,
  };
};

export const validateConfig = (
  config: Record<string, unknown>,
): NotificationConfig => {
  // Basic validation - in production you might want to use Joi or class-validator
  const requiredEnvVars = [
    'KAFKA_BROKERS',
    'REDIS_HOST',
    'EMAIL_HOST',
    'EMAIL_FROM',
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`,
    );
  }

  return config as NotificationConfig;
};
