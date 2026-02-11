import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { NotificationConfig } from '../config/configuration.schema';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private redis: Redis;

  constructor(
    private readonly configService: ConfigService<NotificationConfig>,
  ) {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    const redisConfig = this.configService.get('redis')!;

    this.redis = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      db: redisConfig.db,
      keyPrefix: redisConfig.keyPrefix + 'rate_limit:',
    });

    this.redis.on('connect', () => {
      this.logger.log('Rate limit Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Rate limit Redis connection error', error);
    });
  }

  async checkEmailRateLimit(userId: string): Promise<RateLimitResult> {
    const rateLimitConfig = this.configService.get('rateLimit')!;
    const key = `email:${userId}`;

    return await this.checkSlidingWindowRateLimit(
      key,
      rateLimitConfig.maxEmailsPerWindow,
      rateLimitConfig.windowMs,
    );
  }

  async checkInAppRateLimit(userId: string): Promise<RateLimitResult> {
    const rateLimitConfig = this.configService.get('rateLimit')!;
    const key = `in_app:${userId}`;

    return await this.checkSlidingWindowRateLimit(
      key,
      rateLimitConfig.maxInAppPerWindow,
      rateLimitConfig.windowMs,
    );
  }

  async checkPushRateLimit(userId: string): Promise<RateLimitResult> {
    const rateLimitConfig = this.configService.get('rateLimit')!;
    const key = `push:${userId}`;

    // Push notifications have same limits as in-app for now
    return await this.checkSlidingWindowRateLimit(
      key,
      rateLimitConfig.maxInAppPerWindow,
      rateLimitConfig.windowMs,
    );
  }

  private async checkSlidingWindowRateLimit(
    key: string,
    limit: number,
    windowMs: number,
  ): Promise<RateLimitResult> {
    try {
      const now = Date.now();
      const windowStart = now - windowMs;

      // Use a sorted set for sliding window
      const pipeline = this.redis.pipeline();

      // Remove old entries outside the window
      pipeline.zremrangebyscore(key, 0, windowStart);

      // Count current entries in window
      pipeline.zcard(key);

      // Add current request
      pipeline.zadd(key, now, `${now}-${Math.random()}`);

      // Set expiration
      pipeline.expire(key, Math.ceil(windowMs / 1000));

      const results = await pipeline.exec();

      if (!results) {
        throw new Error('Pipeline execution failed');
      }

      const currentCount = results[1][1] as number;
      const allowed = currentCount < limit;

      // If not allowed, remove the entry we just added
      if (!allowed) {
        await this.redis.zrem(key, `${now}-${Math.random()}`);
      }

      return {
        allowed,
        remaining: Math.max(0, limit - currentCount),
        resetTime: now + windowMs,
        limit,
      };
    } catch (error) {
      this.logger.error(`Rate limit check failed for key: ${key}`, error);
      // Fail open - allow the request if rate limiting fails
      return {
        allowed: true,
        remaining: limit,
        resetTime: Date.now() + windowMs,
        limit,
      };
    }
  }

  async resetRateLimit(
    userId: string,
    type: 'email' | 'in_app' | 'push',
  ): Promise<void> {
    try {
      const key = `${type}:${userId}`;
      await this.redis.del(key);
      this.logger.log(`Rate limit reset for user ${userId}, type: ${type}`);
    } catch (error) {
      this.logger.error(
        `Failed to reset rate limit for user ${userId}, type: ${type}`,
        error,
      );
    }
  }

  async getRateLimitStatus(
    userId: string,
    type: 'email' | 'in_app' | 'push',
  ): Promise<RateLimitResult | null> {
    try {
      const rateLimitConfig = this.configService.get('rateLimit')!;
      const key = `${type}:${userId}`;

      const now = Date.now();
      const windowStart = now - rateLimitConfig.windowMs;

      // Count current entries in window
      await this.redis.zremrangebyscore(key, 0, windowStart);
      const currentCount = await this.redis.zcard(key);

      return {
        allowed: currentCount < rateLimitConfig.maxEmailsPerWindow,
        remaining: Math.max(
          0,
          rateLimitConfig.maxEmailsPerWindow - currentCount,
        ),
        resetTime: now + rateLimitConfig.windowMs,
        limit: rateLimitConfig.maxEmailsPerWindow,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get rate limit status for user ${userId}, type: ${type}`,
        error,
      );
      return null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}
