# A4AD Notification Service

Forum notification service — handles real-time alerts for users.

[![NestJS](https://img.shields.io/badge/NestJS-10+-E0234E?logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Kafka](https://img.shields.io/badge/Kafka-000?logo=apache-kafka)](https://kafka.apache.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)](https://redis.io/)

## Features

- Real-time notifications about new comments, replies, likes, and mentions  
- Delivery channels:  
  - In-app (stored in Redis list per user)  
  - Email (Nodemailer + SMTP / SendGrid / Resend)  
  - Push (placeholder for future FCM/APNs)  
- Mark as read / unread  
- Notification templates with placeholders  
- Rate limiting to prevent spam  
- Retry mechanism + Dead Letter Queue  

## Tech Stack

- **Framework**: NestJS 10+ (TypeScript)  
- **Message Broker**: Apache Kafka  
- **Cache & In-app Storage**: Redis  
- **Email**: Nodemailer (SMTP) or external providers  
- **Testing**: Jest + Supertest  
- **Observability**: OpenTelemetry + Prometheus metrics  

## Kafka Topics (Consumer)

The service listens to the following topics:

| Topic                  | Description                          | Handler                     |
|------------------------|--------------------------------------|-----------------------------|
| `comment.created`      | New comment or reply                 | CommentCreatedHandler       |
| `comment.liked`        | Like on a comment                    | CommentLikedHandler         |
| `post.liked`           | Like on a post                       | PostLikedHandler            |
| `mention.created`      | User mentioned (@username)           | MentionCreatedHandler       |
| `notification.dead_letter` | Failed messages after retries     | DeadLetterHandler           |

## Project Structure

```
src/
├── notifications/
│   ├── notifications.module.ts
│   ├── notifications.service.ts
│   ├── handlers/                   # Kafka event handlers
│   │   ├── comment-created.handler.ts
│   │   ├── comment-liked.handler.ts
│   │   ├── post-liked.handler.ts
│   │   └── mention-created.handler.ts
│   ├── channels/                   # Delivery channels
│   │   ├── email.channel.ts
│   │   ├── in-app.channel.ts
│   │   └── push.channel.ts         # placeholder
│   ├── templates/                  # Notification templates
│   │   └── notification.templates.ts
│   └── dto/
│       └── notification.dto.ts
├── config/
│   ├── configuration.ts
│   └── configuration.schema.ts
├── common/
│   ├── health.controller.ts
│   ├── metrics.service.ts
│   └── rate-limit.service.ts
├── app.module.ts
└── main.ts
```


## Local Development

### Prerequisites

- Docker & Docker Compose  
- Node.js 20+  
- pnpm (recommended)  

### Steps

1. Clone repository
   ```bash
   git clone <repository-url>
   cd notification-service
   ```
2. Copy & configure env
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```
3. Start infrastructure
   ```bash
   docker compose up -d kafka redis
   ```
4. Install dependencies
   ```bash
   pnpm install
   ```
5. Run the service
   ```bash
   # Development mode (hot reload)
   pnpm run start:dev

   # Production build
   pnpm run build
   pnpm run start:prod
   ```
