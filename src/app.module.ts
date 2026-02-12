import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from '@nestjs-modules/ioredis';
import {
  databaseConfig,
  redisConfig,
  kafkaConfig,
  emailConfig,
  appConfig,
} from './config';
import { NotificationsModule } from './notifications/notifications.module';
import { KafkaModule } from './kafka/kafka.module';
import { HealthModule } from './common/health/health.module';
import { MetricsModule } from './common/metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, redisConfig, kafkaConfig, emailConfig, appConfig],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: any) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
      }),
      inject: [ConfigModule],
    }),
    RedisModule.forRootAsync({
      useFactory: (configService: any) => ({
        type: 'single',
        url: `redis://${configService.get('redis.host')}:${configService.get('redis.port')}/${configService.get('redis.db')}`,
        options: {
          password: configService.get('redis.password'),
          keyPrefix: configService.get('redis.keyPrefix'),
        },
      }),
      inject: [ConfigModule],
    }),
    BullModule.forRootAsync({
      useFactory: (configService: any) => ({
        connection: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          password: configService.get('redis.password'),
        },
      }),
      inject: [ConfigModule],
    }),
    NotificationsModule,
    KafkaModule,
    HealthModule,
    MetricsModule,
  ],
})
export class AppModule {}
