import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  rateLimit: {
    emailMax: parseInt(process.env.RATE_LIMIT_EMAIL_MAX || '20', 10),
    inAppMax: parseInt(process.env.RATE_LIMIT_IN_APP_MAX || '100', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '300000', 10), // 5 minutes
  },
  retry: {
    maxAttempts: parseInt(process.env.RETRY_MAX_ATTEMPTS || '3', 10),
    backoffMultiplier: parseInt(
      process.env.RETRY_BACKOFF_MULTIPLIER || '2',
      10,
    ),
  },
}));
