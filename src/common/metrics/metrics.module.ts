import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import {
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
    }),
  ],
  providers: [
    makeCounterProvider({
      name: 'notification_sent_total',
      help: 'Total number of notifications sent',
      labelNames: ['type', 'channel'],
    }),
    makeCounterProvider({
      name: 'notification_failed_total',
      help: 'Total number of failed notifications',
      labelNames: ['type', 'channel', 'reason'],
    }),
    makeHistogramProvider({
      name: 'notification_delivery_latency_seconds',
      help: 'Notification delivery latency in seconds',
      labelNames: ['type', 'channel'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    }),
    makeCounterProvider({
      name: 'notification_read_total',
      help: 'Total number of notifications marked as read',
    }),
  ],
  exports: [
    makeCounterProvider({
      name: 'notification_sent_total',
      help: 'Total number of notifications sent',
      labelNames: ['type', 'channel'],
    }),
    makeCounterProvider({
      name: 'notification_failed_total',
      help: 'Total number of failed notifications',
      labelNames: ['type', 'channel', 'reason'],
    }),
    makeHistogramProvider({
      name: 'notification_delivery_latency_seconds',
      help: 'Notification delivery latency in seconds',
      labelNames: ['type', 'channel'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    }),
    makeCounterProvider({
      name: 'notification_read_total',
      help: 'Total number of notifications marked as read',
    }),
  ],
})
export class MetricsModule {}
