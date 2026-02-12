# A4AD Notification Service

Production-ready notification microservice for the A4AD forum built with NestJS, Kafka, Redis, and PostgreSQL.

[![NestJS](https://img.shields.io/badge/NestJS-11+-E0234E?logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Kafka](https://img.shields.io/badge/Kafka-000?logo=apache-kafka)](https://kafka.apache.org/)
[![Redis](https://img.shields.io/badge/Redis-7+-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## Features

- **Event-Driven Architecture**: Consumes events from Kafka topics (comment.created, comment.liked, post.liked, mention.created)
- **Multiple Delivery Channels**: In-app notifications, email (via SMTP), and push notifications (placeholder)
- **Rate Limiting**: Redis-based rate limiting (20 emails/100 in-app per 5 minutes per user)
- **Idempotency**: Prevents duplicate notifications using idempotency keys
- **Retry Logic**: Exponential backoff with 3 retry attempts
- **Dead Letter Queue**: Failed events are sent to DLQ topics
- **Observability**: Prometheus metrics, health checks, structured logging
- **Production Ready**: Docker support, graceful shutdown, comprehensive error handling

## Tech Stack

- **Framework**: NestJS 11+ with TypeScript (strict mode)
- **Message Broker**: Apache Kafka with KafkaJS
- **Queue**: BullMQ with Redis
- **Database**: PostgreSQL with TypeORM
- **Monitoring**: Prometheus metrics, Terminus health checks
- **Testing**: Jest with 90%+ coverage

## Project Structure

```
src/
├── notifications/
│   ├── notifications.module.ts
│   ├── notifications.service.ts
│   ├── notifications.controller.ts
│   ├── handlers/           # Kafka event handlers
│   │   ├── comment-created.handler.ts
│   │   ├── comment-liked.handler.ts
│   │   ├── post-liked.handler.ts
│   │   └── mention-created.handler.ts
│   ├── channels/           # Delivery channels
│   │   ├── email.channel.ts
│   │   ├── in-app.channel.ts
│   │   └── push.channel.ts
│   ├── templates/          # Notification templates
│   │   └── notification.templates.ts
│   ├── dto/               # Data transfer objects
│   ├── entities/          # Database entities
│   └── *.spec.ts          # Unit tests
├── kafka/
│   └── kafka.module.ts    # Kafka consumer configuration
├── common/
│   ├── health/            # Health checks
│   └── metrics/           # Prometheus metrics
├── config/                # Configuration files
└── main.ts
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- pnpm

### Installation

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Copy environment file:

```bash
cp .env.example .env
```

4. Start infrastructure services:

```bash
docker-compose up -d postgres redis kafka zookeeper
```

5. Run the application:

```bash
pnpm start:dev
```

## API Endpoints

### Get Notifications

```http
GET /notifications?page=1&limit=20&unreadOnly=true
Headers: x-user-id: {userId}
```

### Get Unread Count

```http
GET /notifications/unread-count
Headers: x-user-id: {userId}
```

### Mark as Read

```http
PATCH /notifications/{id}/read
Headers: x-user-id: {userId}
```

### Mark All as Read

```http
POST /notifications/read-all
Headers: x-user-id: {userId}
```

### Health Checks

```http
GET /health          # Full health check
GET /health/ready    # Readiness probe
GET /health/live     # Liveness probe
GET /metrics         # Prometheus metrics
```

## Kafka Events

### Consumed Topics

| Topic                      | Description                   | Handler               |
| -------------------------- | ----------------------------- | --------------------- |
| `comment.created`          | New comment or reply          | CommentCreatedHandler |
| `comment.liked`            | Like on a comment             | CommentLikedHandler   |
| `post.liked`               | Like on a post                | PostLikedHandler      |
| `mention.created`          | User mentioned (@username)    | MentionCreatedHandler |
| `notification.dead_letter` | Failed messages after retries | DLQ                   |

### Produced Topics

- `notification.sent` - Published after successful notification delivery

### Event Schema Examples

#### comment.created

```json
{
  "commentId": "uuid",
  "postId": "uuid",
  "postAuthorId": "uuid",
  "parentCommentId": "uuid?",
  "parentCommentAuthorId": "uuid?",
  "commentAuthorId": "uuid",
  "commentAuthorName": "string",
  "postTitle": "string",
  "content": "string",
  "postUrl": "string"
}
```

#### post.liked

```json
{
  "postId": "uuid",
  "postAuthorId": "uuid",
  "likedByUserId": "uuid",
  "likedByUserName": "string",
  "postTitle": "string",
  "postUrl": "string"
}
```

## Docker Deployment

Build and run with Docker Compose:

```bash
# Build and start all services
docker-compose up --build

# View logs
docker-compose logs -f notification-service

# Scale notification service
docker-compose up --scale notification-service=3
```

## Testing

```bash
# Run unit tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Run e2e tests
pnpm test:e2e

# Run tests in watch mode
pnpm test:watch
```

## Environment Variables

| Variable                | Description           | Default          |
| ----------------------- | --------------------- | ---------------- |
| `NODE_ENV`              | Environment mode      | `development`    |
| `PORT`                  | HTTP port             | `3000`           |
| `DB_HOST`               | PostgreSQL host       | `localhost`      |
| `DB_PORT`               | PostgreSQL port       | `5432`           |
| `REDIS_HOST`            | Redis host            | `localhost`      |
| `REDIS_PORT`            | Redis port            | `6379`           |
| `KAFKA_BROKERS`         | Kafka brokers         | `localhost:9092` |
| `EMAIL_HOST`            | SMTP host             | `smtp.gmail.com` |
| `EMAIL_PORT`            | SMTP port             | `587`            |
| `RATE_LIMIT_EMAIL_MAX`  | Max emails per window | `20`             |
| `RATE_LIMIT_IN_APP_MAX` | Max in-app per window | `100`            |
| `RETRY_MAX_ATTEMPTS`    | Max retry attempts    | `3`              |

See `.env.example` for complete list.

## License

MIT
