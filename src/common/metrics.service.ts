import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as client from 'prom-client';
import * as express from 'express';
import { NotificationConfig } from '../config/configuration.schema';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly register: client.Registry;
  private readonly metricsPort: number;

  // Counters
  private notificationsSentTotal: client.Counter;
  private notificationsFailedTotal: client.Counter;
  private notificationsRetryTotal: client.Counter;

  // Histograms
  private notificationDeliveryLatency: client.Histogram;
  private notificationProcessingTime: client.Histogram;

  // Gauges
  private activeNotificationsGauge: client.Gauge;
  private queueSizeGauge: client.Gauge;

  constructor(
    private readonly configService: ConfigService<NotificationConfig>,
  ) {
    this.register = new client.Registry();
    this.metricsPort = this.configService.get('observability')!.metricsPort;

    // Enable default metrics
    client.collectDefaultMetrics({ register: this.register });

    // Initialize custom metrics
    this.initializeMetrics();

    // Start metrics server
    this.startMetricsServer();
  }

  private initializeMetrics(): void {
    // Counters
    this.notificationsSentTotal = new client.Counter({
      name: 'notification_sent_total',
      help: 'Total number of notifications sent successfully',
      labelNames: ['channel', 'template', 'status'],
      registers: [this.register],
    });

    this.notificationsFailedTotal = new client.Counter({
      name: 'notification_failed_total',
      help: 'Total number of notifications that failed to send',
      labelNames: ['channel', 'template', 'error_type'],
      registers: [this.register],
    });

    this.notificationsRetryTotal = new client.Counter({
      name: 'notification_retry_total',
      help: 'Total number of notification retries',
      labelNames: ['channel', 'template', 'retry_attempt'],
      registers: [this.register],
    });

    // Histograms
    this.notificationDeliveryLatency = new client.Histogram({
      name: 'notification_delivery_latency_seconds',
      help: 'Time taken to deliver notifications',
      labelNames: ['channel', 'template'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
      registers: [this.register],
    });

    this.notificationProcessingTime = new client.Histogram({
      name: 'notification_processing_time_seconds',
      help: 'Time taken to process notification events',
      labelNames: ['event_type', 'handler'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.register],
    });

    // Gauges
    this.activeNotificationsGauge = new client.Gauge({
      name: 'active_notifications',
      help: 'Number of currently active notifications being processed',
      labelNames: ['channel'],
      registers: [this.register],
    });

    this.queueSizeGauge = new client.Gauge({
      name: 'notification_queue_size',
      help: 'Size of notification queues',
      labelNames: ['queue_type'],
      registers: [this.register],
    });
  }

  private startMetricsServer(): void {
    if (!this.configService.get('observability')!.enableMetrics) {
      this.logger.log('Metrics collection is disabled');
      return;
    }

    const app = express.default();

    app.get('/metrics', async (req: express.Request, res: express.Response) => {
      try {
        res.set('Content-Type', this.register.contentType);
        res.end(await this.register.metrics());
      } catch (error) {
        this.logger.error('Failed to generate metrics', error);
        res.status(500).end('Internal Server Error');
      }
    });

    app.listen(this.metricsPort, () => {
      this.logger.log(`Metrics server listening on port ${this.metricsPort}`);
    });
  }

  // Metric recording methods
  recordNotificationSent(
    channel: string,
    template: string,
    status: string = 'success',
  ): void {
    this.notificationsSentTotal.inc({ channel, template, status });
  }

  recordNotificationFailed(
    channel: string,
    template: string,
    errorType: string,
  ): void {
    this.notificationsFailedTotal.inc({
      channel,
      template,
      error_type: errorType,
    });
  }

  recordNotificationRetry(
    channel: string,
    template: string,
    retryAttempt: number,
  ): void {
    this.notificationsRetryTotal.inc({
      channel,
      template,
      retry_attempt: retryAttempt.toString(),
    });
  }

  recordNotificationDeliveryLatency(
    channel: string,
    template: string,
    latencySeconds: number,
  ): void {
    this.notificationDeliveryLatency.observe(
      { channel, template },
      latencySeconds,
    );
  }

  recordNotificationProcessingTime(
    eventType: string,
    handler: string,
    processingTimeSeconds: number,
  ): void {
    this.notificationProcessingTime.observe(
      { event_type: eventType, handler },
      processingTimeSeconds,
    );
  }

  setActiveNotifications(channel: string, count: number): void {
    this.activeNotificationsGauge.set({ channel }, count);
  }

  setQueueSize(queueType: string, size: number): void {
    this.queueSizeGauge.set({ queue_type: queueType }, size);
  }

  // Utility methods
  startTimer(channel: string, template: string): () => void {
    const start = Date.now();
    return () => {
      const duration = (Date.now() - start) / 1000;
      this.recordNotificationDeliveryLatency(channel, template, duration);
    };
  }

  startProcessingTimer(eventType: string, handler: string): () => void {
    const start = Date.now();
    return () => {
      const duration = (Date.now() - start) / 1000;
      this.recordNotificationProcessingTime(eventType, handler, duration);
    };
  }

  async getMetrics(): Promise<string> {
    return await this.register.metrics();
  }

  getRegistry(): client.Registry {
    return this.register;
  }

  // Health check for metrics
  async isMetricsHealthy(): Promise<boolean> {
    try {
      await this.getMetrics();
      return true;
    } catch (error) {
      this.logger.error('Metrics health check failed', error);
      return false;
    }
  }
}
