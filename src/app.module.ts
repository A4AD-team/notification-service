import { Module } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { configuration } from './config/configuration';
import { AppConfigModule } from './config/app-config.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthController } from './common/health.controller';
import { MetricsService } from './common/metrics.service';
import { RetryService } from './common/retry.service';
import { RateLimitService } from './common/rate-limit.service';
import { NotificationConfig } from './config/configuration.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    AppConfigModule,
    NotificationsModule,

    // Kafka client setup
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_CLIENT',
        useFactory: async (
          configService: ConfigService<NotificationConfig>,
        ) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              brokers: configService.get('kafka.brokers')!,
              clientId: configService.get('kafka.clientId')!,
            },
            consumer: {
              groupId: configService.get('kafka.consumer.groupId')!,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [HealthController],
  providers: [MetricsService, RetryService, RateLimitService],
})
export class AppModule {
  constructor(
    private readonly configService: ConfigService<NotificationConfig>,
  ) {}

  async configure(consumer: any) {
    // Configure Kafka consumer
    const kafkaConfig = this.configService.get('kafka')!;

    consumer
      .subscribeToTopics([
        kafkaConfig.topics.requestCreated,
        kafkaConfig.topics.requestSubmitted,
        kafkaConfig.topics.requestStageAdvanced,
        kafkaConfig.topics.requestCompleted,
        kafkaConfig.topics.requestRejected,
        kafkaConfig.topics.requestChangesRequested,
        kafkaConfig.topics.requestResubmitted,
        kafkaConfig.topics.requestCancelled,
        kafkaConfig.topics.stageTimeout,
        kafkaConfig.topics.stageReminder,
        kafkaConfig.topics.commentAdded,
      ])
      .deserializeContent('json');
  }
}
