import { Module, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from '@nestjs-modules/ioredis';
import {
  databaseConfig,
  redisConfig,
  rabbitmqConfig,
  emailConfig,
  appConfig,
} from './config';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthModule } from './common/health/health.module';
import { MetricsModule } from './common/metrics/metrics.module';
import { RabbitMQConsumerService } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        redisConfig,
        rabbitmqConfig,
        emailConfig,
        appConfig,
      ],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<boolean>('database.synchronize'),
        logging: configService.get<boolean>('database.logging'),
      }),
      inject: [ConfigService],
    }),
    RedisModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: `redis://${configService.get<string>('redis.host')}:${configService.get<string>('redis.port')}/${configService.get<number>('redis.db')}`,
        options: {
          password: configService.get<string | undefined>('redis.password'),
          keyPrefix: configService.get<string>('redis.keyPrefix'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          password: configService.get<string | undefined>('redis.password'),
        },
      }),
      inject: [ConfigService],
    }),
    NotificationsModule,
    HealthModule,
    MetricsModule,
  ],
  providers: [RabbitMQConsumerService],
})
export class AppModule implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppModule.name);

  constructor(
    private readonly rabbitMQConsumerService: RabbitMQConsumerService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.rabbitMQConsumerService.connect();
    } catch (error) {
      this.logger.error('Failed to start RabbitMQ consumer:', error);
    }
  }
}
