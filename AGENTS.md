# AGENTS.md

This file contains guidelines and commands for agentic coding agents working in this NestJS project service repository.

## Project Overview

This is a NestJS project service built with TypeScript.

- **Framework**: NestJS 11+
- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Testing**: Jest with supertest for e2e
- **Code Quality**: ESLint + Prettier + Lefthook pre-commit hooks

## Essential Commands

### Development

```bash
# Start development server with hot reload
npm run start:dev

# Start development server in debug mode
npm run start:debug

# Build for production
npm run build

# Start production build
npm run start:prod
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run specific test file
npm test -- notification.service.spec.ts

# Run tests matching a pattern
npm test -- --testNamePattern="notification"

# Run e2e tests
npm run test:e2e
```

### Code Quality

```bash
# Lint all TypeScript files (auto-fixes)
npm run lint

# Lint specific file
npm run lint -- src/app.controller.ts

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check

# Type checking (use tsc directly)
npx tsc --noEmit
```

### Dependencies

```bash
# Install new dependency
npm install package-name

# Install dev dependency
npm install --save-dev package-name

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

## Code Style Guidelines

### Imports

- Use relative imports with `@/` alias when possible
- Group imports in order: 1) Node.js, 2) External packages, 3) Internal modules, 4) Relative imports
- Use `import`/`export` syntax, never `require()`
- Remove unused imports

```typescript
// ❌ Bad
import { Injectable } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { AppService } from './app.service';

// ✅ Good
import { Injectable, Module } from '@nestjs/common';
import { AppService } from './app.service';
```

### Formatting & Style

- Use Prettier configuration (format with `npm run format`)
- 2-space indentation
- Single quotes for strings
- Trailing commas where permitted
- Max line length: 100 characters

### Naming Conventions

- **Files**: kebab-case (e.g., `notification.service.ts`, `user-notification.module.ts`)
- **Classes**: PascalCase (e.g., `NotificationService`, `EmailNotificationModule`)
- **Methods/Functions**: camelCase (e.g., `sendNotification()`, `getUserPreferences()`)
- **Variables**: camelCase (e.g., `notificationTemplate`, `userEmail`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`, `NOTIFICATION_TYPES`)
- **Interfaces**: Prefix with `I` (e.g., `INotificationTemplate`, `IUserPreferences`)

### Type Safety

- Always use TypeScript types - avoid `any` (ESLint rule is disabled but prefer types)
- Prefer explicit return types for public methods
- Use enums for constants with multiple related values
- Use DTOs for request/response validation

```typescript
// ✅ Good
export enum NotificationType {
  EMAIL = 'email',
  PUSH = 'push',
  IN_APP = 'in_app',
}

export interface INotificationDto {
  userId: string;
  type: NotificationType;
  message: string;
}

export async sendNotification(dto: INotificationDto): Promise<boolean> {
  // implementation
}
```

### Error Handling

- Use NestJS built-in exceptions (`@nestjs/common`)
- Create custom exceptions for domain-specific errors
- Always include meaningful error messages
- Use proper HTTP status codes

```typescript
import { BadRequestException, NotFoundException } from '@nestjs/common';

// ✅ Good
if (!user) {
  throw new NotFoundException(`User with ID ${userId} not found`);
}

if (!email) {
  throw new BadRequestException('Email is required for email notifications');
}
```

### Services & Dependency Injection

- Use `@Injectable()` for services
- Inject dependencies via constructor
- Keep services single responsibility
- Use interfaces for service contracts

### Modules

- Organize by feature/domain
- Each feature should have its own module
- Use `@Global()` only when necessary
- Import/export modules properly

### Environment Configuration

- Use `@nestjs/config` for configuration management
- Store sensitive data in environment variables
- Create typed configuration classes

### Testing

- Unit tests should be co-located with source files (`.spec.ts` suffix)
- Use Jest as testing framework
- Mock external dependencies
- Test both success and failure scenarios
- Aim for >80% code coverage

```typescript
// ✅ Good test structure
describe('NotificationService', () => {
  let service: NotificationService;
  let emailService: EmailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [NotificationService, EmailService],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    emailService = module.get<EmailService>(EmailService);
  });

  describe('sendEmailNotification', () => {
    it('should send email successfully', async () => {
      // Arrange
      jest.spyOn(emailService, 'send').mockResolvedValue(true);

      // Act
      const result = await service.sendEmailNotification(dto);

      // Assert
      expect(result).toBe(true);
      expect(emailService.send).toHaveBeenCalledWith(dto);
    });
  });
});
```

## Git Workflow

This repository enforces Git Flow with conventional commits:

### Branch Naming

- `feature/<description>` - New features
- `bugfix/<description>` - Bug fixes
- `hotfix/<description>` - Production hotfixes
- `release/<version>` - Release preparation

### Commit Format

```
<type>[optional scope]: <description>

Examples:
feat(notification): add email template support
fix: resolve memory leak in rate limiter
docs(api): update notification endpoints
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style
- `refactor` - Code refactoring
- `test` - Tests
- `chore` - Maintenance
- `perf` - Performance

## Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and run tests: `npm test`
3. Check formatting: `npm run format:check`
4. Lint code: `npm run lint`
5. Commit with conventional format: `git commit -m "feat: add new feature"`
6. Push and create PR

## Important Notes

- Never push directly to `main`, `develop`, `release/*`, or `hotfix/*` branches
- Always run tests and linting before committing (enforced by pre-commit hooks)
- Use the NestJS CLI when generating new modules/services: `nest generate module notification`
- Follow SOLID principles and clean architecture patterns
- Consider performance and scalability when implementing features
- Document complex business logic with comments
