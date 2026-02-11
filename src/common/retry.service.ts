import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientKafka } from '@nestjs/microservices';
import { NotificationConfig } from '../config/configuration.schema';

export interface RetryableMessage {
  originalTopic: string;
  originalMessage: any;
  retryCount: number;
  lastRetryTime: number;
  error?: string;
}

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);
  private readonly maxRetries = 3;
  private readonly retryDelays = [1000, 5000, 15000]; // 1s, 5s, 15s

  constructor(
    private readonly configService: ConfigService<NotificationConfig>,
    private readonly kafkaClient: ClientKafka,
  ) {}

  async shouldRetryMessage(error: Error, retryCount: number): Promise<boolean> {
    // Don't retry on validation errors or business logic errors
    if (this.isNonRetryableError(error)) {
      return false;
    }

    // Check if we've exceeded max retries
    return retryCount < this.maxRetries;
  }

  async scheduleRetry(
    originalTopic: string,
    originalMessage: any,
    retryCount: number,
    error: Error,
  ): Promise<void> {
    try {
      const delay = this.getRetryDelay(retryCount);
      const retryMessage: RetryableMessage = {
        originalTopic,
        originalMessage,
        retryCount: retryCount + 1,
        lastRetryTime: Date.now(),
        error: error.message,
      };

      // Schedule retry using setTimeout for simplicity
      // In production, you might want to use a more reliable scheduling mechanism
      setTimeout(async () => {
        await this.executeRetry(retryMessage);
      }, delay);

      this.logger.log(
        `Scheduled retry for message on topic ${originalTopic}, attempt ${retryCount + 1}, delay ${delay}ms`,
      );
    } catch (retryError) {
      this.logger.error(
        `Failed to schedule retry for message on topic ${originalTopic}`,
        retryError,
      );
      await this.sendToDeadLetterQueue(originalTopic, originalMessage, error);
    }
  }

  private async executeRetry(retryMessage: RetryableMessage): Promise<void> {
    try {
      this.logger.log(
        `Executing retry for message on topic ${retryMessage.originalTopic}, attempt ${retryMessage.retryCount}`,
      );

      // Republish the message to original topic
      await this.kafkaClient.emit(
        retryMessage.originalTopic,
        retryMessage.originalMessage,
      );

      this.logger.log(
        `Successfully retried message on topic ${retryMessage.originalTopic}, attempt ${retryMessage.retryCount}`,
      );
    } catch (error) {
      this.logger.error(
        `Retry failed for message on topic ${retryMessage.originalTopic}, attempt ${retryMessage.retryCount}`,
        error,
      );

      if (retryMessage.retryCount >= this.maxRetries) {
        await this.sendToDeadLetterQueue(
          retryMessage.originalTopic,
          retryMessage.originalMessage,
          error as Error,
        );
      } else {
        // Schedule another retry
        await this.scheduleRetry(
          retryMessage.originalTopic,
          retryMessage.originalMessage,
          retryMessage.retryCount,
          error as Error,
        );
      }
    }
  }

  private async sendToDeadLetterQueue(
    originalTopic: string,
    originalMessage: any,
    error: Error,
  ): Promise<void> {
    try {
      const kafkaConfig = this.configService.get('kafka')!;
      const deadLetterTopic = kafkaConfig.topics.deadLetter;

      const deadLetterMessage = {
        originalTopic,
        originalMessage,
        failedAt: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        retryCount: this.maxRetries,
      };

      await this.kafkaClient.emit(deadLetterTopic, deadLetterMessage);

      this.logger.error(
        `Message sent to dead letter queue. Original topic: ${originalTopic}, Error: ${error.message}`,
      );
    } catch (dlqError) {
      this.logger.error(
        `Failed to send message to dead letter queue. Original topic: ${originalTopic}`,
        dlqError,
      );
      // This is a critical error - you might want to alert or log to a separate system
    }
  }

  private isNonRetryableError(error: Error): boolean {
    const nonRetryablePatterns = [
      /validation/i,
      /authentication/i,
      /authorization/i,
      /permission/i,
      /not found/i,
      /bad request/i,
    ];

    return nonRetryablePatterns.some(
      (pattern) => pattern.test(error.message) || pattern.test(error.name),
    );
  }

  private getRetryDelay(retryCount: number): number {
    if (retryCount < this.retryDelays.length) {
      return this.retryDelays[retryCount];
    }

    // Exponential backoff for additional retries beyond configured delays
    return (
      this.retryDelays[this.retryDelays.length - 1] *
      Math.pow(2, retryCount - this.retryDelays.length + 1)
    );
  }

  async getRetryStats(): Promise<{
    totalRetries: number;
    successfulRetries: number;
    failedRetries: number;
    deadLetterMessages: number;
  }> {
    // TODO: Implement retry statistics tracking
    // This could be stored in Redis or a database
    return {
      totalRetries: 0,
      successfulRetries: 0,
      failedRetries: 0,
      deadLetterMessages: 0,
    };
  }

  async resetRetryStats(): Promise<void> {
    // TODO: Implement retry statistics reset
    this.logger.log('Retry statistics reset');
  }
}
