import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationConfig } from '../config/configuration.schema';

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    kafka: boolean;
    redis: boolean;
    email: boolean;
  };
  metrics?: {
    notificationsSent: number;
    notificationsFailed: number;
    averageDeliveryTime: number;
  };
}

@Controller('health')
export class HealthController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService<NotificationConfig>,
  ) {}

  @Get()
  async getHealthStatus(): Promise<HealthCheckResponse> {
    const startTime = Date.now();

    // Check all services
    const [kafkaConnected, redisConnected, emailConnected] = await Promise.all([
      this.checkKafkaConnection(),
      this.checkRedisConnection(),
      this.checkEmailConnection(),
    ]);

    const allServicesConnected =
      kafkaConnected && redisConnected && emailConnected;
    const responseTime = Date.now() - startTime;

    return {
      status: allServicesConnected ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        kafka: kafkaConnected,
        redis: redisConnected,
        email: emailConnected,
      },
      metrics: {
        notificationsSent: 0, // TODO: Implement metrics tracking
        notificationsFailed: 0,
        averageDeliveryTime: responseTime,
      },
    };
  }

  @Get('kafka')
  async checkKafkaHealth(): Promise<{ status: boolean; details?: string }> {
    const connected = await this.checkKafkaConnection();
    return {
      status: connected,
      details: connected
        ? 'Kafka connection is healthy'
        : 'Cannot connect to Kafka',
    };
  }

  @Get('redis')
  async checkRedisHealth(): Promise<{ status: boolean; details?: string }> {
    const connected = await this.checkRedisConnection();
    return {
      status: connected,
      details: connected
        ? 'Redis connection is healthy'
        : 'Cannot connect to Redis',
    };
  }

  @Get('email')
  async checkEmailHealth(): Promise<{ status: boolean; details?: string }> {
    const connected = await this.checkEmailConnection();
    return {
      status: connected,
      details: connected
        ? 'Email service is healthy'
        : 'Email service is not responding',
    };
  }

  @Get('readiness')
  async getReadiness(): Promise<{
    ready: boolean;
    checks: Record<string, boolean>;
  }> {
    const checks = {
      kafka: await this.checkKafkaConnection(),
      redis: await this.checkRedisConnection(),
      email: await this.checkEmailConnection(),
    };

    const ready = Object.values(checks).every((status) => status);

    return {
      ready,
      checks,
    };
  }

  @Get('liveness')
  getLiveness(): { alive: boolean; timestamp: string } {
    // Basic liveness check - if the service is responding, it's alive
    return {
      alive: true,
      timestamp: new Date().toISOString(),
    };
  }

  private checkKafkaConnection(): boolean {
    try {
      // TODO: Implement actual Kafka connection check
      // This would involve checking the Kafka client connection status
      return true;
    } catch {
      return false;
    }
  }

  private async checkRedisConnection(): Promise<boolean> {
    try {
      return await this.notificationsService.checkRedisHealth();
    } catch {
      return false;
    }
  }

  private async checkEmailConnection(): Promise<boolean> {
    try {
      return await this.notificationsService.checkEmailHealth();
    } catch {
      return false;
    }
  }
}
