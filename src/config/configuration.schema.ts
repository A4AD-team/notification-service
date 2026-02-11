export interface AppConfig {
  port: number;
  nodeEnv: string;
}

export interface KafkaConfig {
  brokers: string[];
  clientId: string;
  consumer: {
    groupId: string;
  };
  producer: {
    clientId: string;
  };
  topics: {
    requestCreated: string;
    requestSubmitted: string;
    requestStageAdvanced: string;
    requestCompleted: string;
    requestRejected: string;
    requestChangesRequested: string;
    requestResubmitted: string;
    requestCancelled: string;
    stageTimeout: string;
    stageReminder: string;
    commentAdded: string;
    deadLetter: string;
  };
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  pool?: boolean;
  maxConnections?: number;
  maxMessages?: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxEmailsPerWindow: number;
  maxInAppPerWindow: number;
}

export interface ObservabilityConfig {
  enableTracing: boolean;
  enableMetrics: boolean;
  serviceName: string;
  serviceVersion: string;
  metricsPort: number;
}

export interface NotificationConfig {
  app: AppConfig;
  kafka: KafkaConfig;
  redis: RedisConfig;
  email: EmailConfig;
  rateLimit: RateLimitConfig;
  observability: ObservabilityConfig;
}

export const configSchema = {
  NODE_ENV: {
    default: 'development',
    choices: ['development', 'production', 'test'],
  },
  PORT: {
    default: 3000,
    type: 'number',
  },
  KAFKA_BROKERS: {
    default: 'localhost:9092',
    type: 'string',
  },
  KAFKA_CLIENT_ID: {
    default: 'notification-service',
    type: 'string',
  },
  KAFKA_CONSUMER_GROUP_ID: {
    default: 'notification-service-consumer',
    type: 'string',
  },
  REDIS_HOST: {
    default: 'localhost',
    type: 'string',
  },
  REDIS_PORT: {
    default: 6379,
    type: 'number',
  },
  REDIS_PASSWORD: {
    type: 'string',
    default: '',
  },
  REDIS_DB: {
    default: 0,
    type: 'number',
  },
  REDIS_KEY_PREFIX: {
    default: 'a4ad:notifications:',
    type: 'string',
  },
  EMAIL_HOST: {
    default: 'localhost',
    type: 'string',
  },
  EMAIL_PORT: {
    default: 587,
    type: 'number',
  },
  EMAIL_SECURE: {
    default: false,
    type: 'boolean',
  },
  EMAIL_USER: {
    type: 'string',
    default: '',
  },
  EMAIL_PASS: {
    type: 'string',
    default: '',
  },
  EMAIL_FROM: {
    type: 'string',
    default: 'noreply@a4ad.com',
  },
  EMAIL_POOL: {
    default: true,
    type: 'boolean',
  },
  EMAIL_MAX_CONNECTIONS: {
    default: 5,
    type: 'number',
  },
  EMAIL_MAX_MESSAGES: {
    default: 100,
    type: 'number',
  },
  RATE_LIMIT_WINDOW_MS: {
    default: 300000, // 5 minutes
    type: 'number',
  },
  RATE_LIMIT_MAX_EMAILS: {
    default: 10,
    type: 'number',
  },
  RATE_LIMIT_MAX_INAPP: {
    default: 50,
    type: 'number',
  },
  OBSERVABILITY_ENABLE_TRACING: {
    default: true,
    type: 'boolean',
  },
  OBSERVABILITY_ENABLE_METRICS: {
    default: true,
    type: 'boolean',
  },
  OBSERVABILITY_SERVICE_NAME: {
    default: 'notification-service',
    type: 'string',
  },
  OBSERVABILITY_SERVICE_VERSION: {
    default: '1.0.0',
    type: 'string',
  },
  OBSERVABILITY_METRICS_PORT: {
    default: 9090,
    type: 'number',
  },
};
