# AGENTS.md

Guidelines for agentic coding agents working in this NestJS notification service repository.

## Project Overview

NestJS 11+ notification service with TypeScript, Node.js 20+, Jest testing, and ESLint/Prettier code quality.

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
- Group imports: Node.js → External packages → Internal modules → Relative imports
- Use `import`/`export` syntax, never `require()`
- Remove unused imports

### Formatting & Style

- Prettier config: 2-space indentation, single quotes, trailing commas, 100 char line length
- Format with `npm run format`, check with `npm run format:check`

### Naming Conventions

- **Files**: kebab-case (`notification.service.ts`, `user-notification.module.ts`)
- **Classes**: PascalCase (`NotificationService`, `EmailNotificationModule`)
- **Methods/Functions**: camelCase (`sendNotification()`, `getUserPreferences()`)
- **Variables**: camelCase (`notificationTemplate`, `userEmail`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`, `NOTIFICATION_TYPES`)
- **Interfaces**: Prefix with `I` (`INotificationTemplate`, `IUserPreferences`)

### Type Safety

- Use TypeScript types, avoid `any` (ESLint rule disabled but prefer types)
- Prefer explicit return types for public methods
- Use enums for related constants, DTOs for request/response validation

### Error Handling

- Use NestJS built-in exceptions (`@nestjs/common`)
- Create custom exceptions for domain-specific errors
- Include meaningful error messages and proper HTTP status codes

### Services & Dependency Injection

- Use `@Injectable()` for services
- Inject dependencies via constructor
- Keep services single responsibility
- Use interfaces for service contracts

### Modules

- Organize by feature/domain with separate modules per feature
- Use `@Global()` only when necessary
- Import/export modules properly

### Environment Configuration

- Use `@nestjs/config` for configuration management
- Store sensitive data in environment variables
- Create typed configuration classes

### Testing

- Unit tests co-located with source files (`.spec.ts` suffix)
- Use Jest framework, mock external dependencies
- Test both success and failure scenarios, aim for >80% coverage

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

- Never push directly to protected branches (`main`, `develop`, `release/*`, `hotfix/*`)
- Run tests and linting before committing (enforced by pre-commit hooks)
- Use NestJS CLI: `nest generate module notification`
- Follow SOLID principles and document complex logic
