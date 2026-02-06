# Notification Service

Отправка уведомлений (email, in-app, push) по событиям.

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10+-E0234E?logo=nestjs)](https://nestjs.com/)
[![Kafka](https://img.shields.io/badge/Kafka-3+-000?logo=apache-kafka)](https://kafka.apache.org/)
[![Redis](https://img.shields.io/badge/Redis-7+-DC382D?logo=redis)](https://redis.io/)

## Технологический стек

- NestJS
- @nestjs/microservices + Kafka
- Redis (очереди, шаблоны, rate-limit)
- Nodemailer / SendGrid / Firebase
- BullMQ / @nestjs/bull (опционально)

## Запуск

```bash
docker compose up -d redis kafka

npm run start:dev
```
