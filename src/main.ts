import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { NotificationConfig } from './config/configuration.schema';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<NotificationConfig>);

  const appConfig = configService.get('app')!;
  const kafkaConfig = configService.get('kafka')!;

  // Create hybrid microservice (Kafka + HTTP for health checks)
  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: kafkaConfig.brokers,
        clientId: kafkaConfig.clientId,
      },
      consumer: {
        groupId: kafkaConfig.consumer.groupId,
        allowAutoTopicCreation: false,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
      },
      run: {
        autoCommit: true,
        autoCommitInterval: 5000,
        autoCommitThreshold: 1,
      },
      subscribe: {
        fromBeginning: false,
      },
    },
  });

  // Start HTTP server for health checks and metrics
  await app.listen(appConfig.port, '0.0.0.0');

  // Start Kafka microservice
  await microservice.listen();

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);

    // Close microservice first
    await microservice.close();

    // Then close HTTP server
    await app.close();

    console.log('Application shut down successfully');
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  console.log(`🚀 Notification Service is running:`);
  console.log(`   HTTP Server: http://localhost:${appConfig.port}`);
  console.log(`   Health Check: http://localhost:${appConfig.port}/health`);
  console.log(`   Kafka Brokers: ${kafkaConfig.brokers.join(', ')}`);
  console.log(`   Consumer Group: ${kafkaConfig.consumer.groupId}`);
  console.log(`   Environment: ${appConfig.nodeEnv}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
