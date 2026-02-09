# A4AD Notification Service

Микросервис для отправки уведомлений в системе согласования заявок A4AD.

## Обзор

Сервис отвечает за:

- Подписку на события Kafka и обработку их
- Отправку email уведомлений через SMTP
- Хранение in-app уведомлений в Redis
- Rate limiting для предотвращения спама
- Retry механизм и Dead Letter Queue
- Метрики и health checks

## Технологический стек

- **Framework**: NestJS 11+ (TypeScript)
- **Message Broker**: Apache Kafka
- **Cache**: Redis
- **Email**: Nodemailer + SMTP
- **Metrics**: Prometheus + prom-client
- **Testing**: Jest

## Поддерживаемые события Kafka

Сервис подписывается на следующие топики:

| Топик                       | Описание                      | Обработчик              |
| --------------------------- | ----------------------------- | ----------------------- |
| `request.created`           | Создание заявки               | RequestCreatedHandler   |
| `request.submitted`         | Подача заявки на согласование | RequestSubmittedHandler |
| `request.stage_advanced`    | Переход на следующий этап     | -                       |
| `request.completed`         | Завершение заявки             | RequestCompletedHandler |
| `request.rejected`          | Отклонение заявки             | -                       |
| `request.changes_requested` | Запрос изменений              | -                       |
| `request.resubmitted`       | Повторная подача              | -                       |
| `request.cancelled`         | Отмена заявки                 | -                       |
| `stage.timeout`             | Истечение времени этапа       | StageTimeoutHandler     |
| `stage.reminder`            | Напоминание об этапе          | -                       |
| `comment.added`             | Добавление комментария        | -                       |
| `notification.dead_letter`  | Dead Letter Queue             | -                       |

## Структура проекта

```
src/
├── notifications/
│   ├── notifications.module.ts
│   ├── notifications.service.ts
│   ├── handlers/              # Обработчики событий Kafka
│   │   ├── base-kafka-event.handler.ts
│   │   ├── request-created.handler.ts
│   │   ├── request-submitted.handler.ts
│   │   ├── request-completed.handler.ts
│   │   └── stage-timeout.handler.ts
│   ├── channels/              # Каналы уведомлений
│   │   ├── email.channel.ts
│   │   ├── in-app.channel.ts
│   │   └── push.channel.ts
│   ├── templates/             # Шаблоны уведомлений
│   │   └── notification.templates.ts
│   └── dto/                   # DTO для событий
│       └── kafka-event.dto.ts
├── config/
│   ├── configuration.ts
│   ├── configuration.schema.ts
│   └── app-config.module.ts
├── common/
│   ├── health.controller.ts
│   ├── metrics.service.ts
│   ├── rate-limit.service.ts
│   └── retry.service.ts
├── app.module.ts
└── main.ts
```

## Запуск локально

### Предварительные требования

- Docker & Docker Compose
- Node.js 20+
- pnpm

### Шаги для запуска

1. **Клонирование репозитория**

   ```bash
   git clone <repository-url>
   cd notification-service
   ```

2. **Настройка переменных окружения**

   ```bash
   cp .env.example .env
   # Отредактируйте .env с вашими настройками
   ```

3. **Запуск инфраструктуры**

   ```bash
   docker-compose up -d kafka redis
   ```

4. **Установка зависимостей**

   ```bash
   pnpm install
   ```

5. **Запуск приложения**

   ```bash
   # Development режим
   pnpm run start:dev

   # Production режим
   pnpm run build
   pnpm run start:prod
   ```

### Запуск с Docker Compose

```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f notification-service

# Остановка
docker-compose down
```

## Переменные окружения

| Переменная                | Описание                | По умолчанию                    |
| ------------------------- | ----------------------- | ------------------------------- |
| `NODE_ENV`                | Окружение               | `development`                   |
| `PORT`                    | Порт HTTP сервера       | `3000`                          |
| `KAFKA_BROKERS`           | Kafka брокеры           | `localhost:9092`                |
| `KAFKA_CLIENT_ID`         | ID клиента Kafka        | `notification-service`          |
| `KAFKA_CONSUMER_GROUP_ID` | ID группы консьюмера    | `notification-service-consumer` |
| `REDIS_HOST`              | Redis хост              | `localhost`                     |
| `REDIS_PORT`              | Redis порт              | `6379`                          |
| `REDIS_PASSWORD`          | Redis пароль            | -                               |
| `EMAIL_HOST`              | SMTP хост               | `localhost`                     |
| `EMAIL_PORT`              | SMTP порт               | `587`                           |
| `EMAIL_USER`              | Email пользователь      | -                               |
| `EMAIL_PASS`              | Email пароль            | -                               |
| `EMAIL_FROM`              | Email отправителя       | `noreply@a4ad.com`              |
| `RATE_LIMIT_WINDOW_MS`    | Окно rate limiting (мс) | `300000`                        |
| `RATE_LIMIT_MAX_EMAILS`   | Максимум email за окно  | `10`                            |
| `RATE_LIMIT_MAX_INAPP`    | Максимум in-app за окно | `50`                            |

## API Endpoints

### Health Checks

- `GET /health` - Общий health check
- `GET /health/kafka` - Проверка Kafka соединения
- `GET /health/redis` - Проверка Redis соединения
- `GET /health/email` - Проверка email сервиса
- `GET /health/readiness` - Проверка готовности
- `GET /health/liveness` - Проверка жизнеспособности

### Метрики

- `GET /metrics` - Prometheus метрики (порт 9090)

## Шаблоны уведомлений

Сервис поддерживает следующие шаблоны:

### Email шаблоны

- `request-created` - "Ваша заявка создана"
- `request-submitted` - "Требуется ваше согласование"
- `request-approved` - "Заявка одобрена"
- `request-rejected` - "Заявка отклонена"
- `request-changes-requested` - "Требуется доработка"
- `stage-timeout` - "Истекло время согласования"
- `stage-reminder` - "Напоминание о согласовании"

### In-app шаблоны

Все email шаблоны также доступны как in-app с более короткими сообщениями.

## Добавление нового шаблона

1. Добавьте шаблон в `NotificationTemplates`:

   ```typescript
   static templates = new Map([
     // ... существующие шаблоны
     ['new-template', {
       subject: 'Новый шаблон',
       text: 'Текст нового шаблона с {placeholder}',
       message: 'Сообщение нового шаблона',
       title: 'Новый шаблон',
     }],
   ]);
   ```

2. Используйте в обработчике:
   ```typescript
   await this.notificationsService.sendNotification({
     userId: event.userId,
     type: 'email',
     template: 'new-template',
     data: { placeholder: 'значение' },
   });
   ```

## Добавление нового канала

1. Создайте класс канала:

   ```typescript
   @Injectable()
   export class NewChannel implements INotificationChannel {
     async send(notification: NotificationData): Promise<boolean> {
       // Реализация отправки
     }
   }
   ```

2. Добавьте в модуль:

   ```typescript
   @Module({
     providers: [NewChannel],
   })
   export class NotificationsModule {}
   ```

3. Обновите `NotificationsService`

## Тестирование

```bash
# Запуск всех тестов
pnpm test

# Запуск в watch режиме
pnpm run test:watch

# Запуск с покрытием
pnpm run test:cov

# Запуск конкретного теста
pnpm test -- request-created.handler.spec.ts
```

## Мониторинг

### Метрики

Сервис экспортирует следующие метрики:

- `notification_sent_total` - Количество отправленных уведомлений
- `notification_failed_total` - Количество неудачных отправок
- `notification_retry_total` - Количество retry попыток
- `notification_delivery_latency_seconds` - Время доставки
- `notification_processing_time_seconds` - Время обработки

### Логирование

Сервис использует структурированное логирование с уровнями:

- `ERROR` - Критические ошибки
- `WARN` - Предупреждения
- `LOG` - Информационные сообщения
- `DEBUG` - Отладочная информация

## Rate Limiting

Сервис применяет rate limiting:

- **Email**: 10 сообщений на пользователя в 5 минут
- **In-app**: 50 сообщений на пользователя в 5 минут
- **Push**: 50 сообщений на пользователя в 5 минут

Rate limiting реализован через Redis с использованием sliding window алгоритма.

## Retry и Dead Letter Queue

При ошибках отправки:

1. **Retry** - до 3 попыток с backoff (1s, 5s, 15s)
2. **Dead Letter Queue** - после исчерпания retry попыток
3. **Non-retryable ошибки** - сразу в DLQ (validation, auth ошибки)

## Production развертывание

### Рекомендации

1. **Ресурсы**: минимально 512MB RAM, 1 CPU
2. **Репликация**: Kafka кластер с репликацией factor 3
3. **Redis**: Redis Cluster для высокой доступности
4. **Мониторинг**: Prometheus + Grafana + AlertManager
5. **Логирование**: ELK Stack или similar
6. **Health checks**: Kubernetes liveness/readiness probes

### Environment переменные для Production

```bash
NODE_ENV=production
KAFKA_BROKERS=kafka-1:9092,kafka-2:9092,kafka-3:9092
REDIS_HOST=redis-cluster
REDIS_PASSWORD=<strong-password>
EMAIL_HOST=<production-smtp>
EMAIL_USER=<production-email>
EMAIL_PASS=<production-password>
OBSERVABILITY_ENABLE_TRACING=true
OBSERVABILITY_ENABLE_METRICS=true
```

## Траблшутинг

### Частые проблемы

1. **Kafka connection refused**
   - Проверьте что Kafka запущен: `docker-compose ps kafka`
   - Проверьте брокеры в `KAFKA_BROKERS`

2. **Redis connection failed**
   - Проверьте Redis: `docker-compose ps redis`
   - Проверьте пароль в `REDIS_PASSWORD`

3. **Email sending failed**
   - Проверьте SMTP настройки
   - Проверьте аутентификацию

4. **Rate limiting слишком строгий**
   - Увеличьте `RATE_LIMIT_MAX_*`
   - Уменьшите `RATE_LIMIT_WINDOW_MS`

### Логи для диагностики

```bash
# Просмотр логов сервиса
docker-compose logs -f notification-service

# Просмотр логов Kafka
docker-compose logs -f kafka

# Просмотр логов Redis
docker-compose logs -f redis
```

## Контакты

- **Разработчик**: notification-service@a4ad.com
- **Документация**: https://docs.a4ad.com/notification-service
- **Issues**: https://github.com/a4ad/notification-service/issues
