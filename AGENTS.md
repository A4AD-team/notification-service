# AGENTS.md

Guidelines for agentic coding agents working in this NestJS notification service repository.

## Project Overview

NestJS 11+ notification service with TypeScript, Node.js 20+, pnpm package manager, Jest testing, and ESLint/Prettier code quality.

## Essential Commands

### Development

```bash
# Start development server with hot reload
pnpm start:dev

# Start development server in debug mode
pnpm start:debug

# Build for production
pnpm build

# Start production build
pnpm start:prod
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cov

# Run specific test file
pnpm test -- app.controller.spec.ts

# Run tests matching a pattern
pnpm test -- --testNamePattern="should return"

# Run e2e tests
pnpm test:e2e

# Debug tests
pnpm test:debug
```

### Code Quality

```bash
# Lint all TypeScript files (auto-fixes)
pnpm lint

# Lint specific file
pnpm lint -- src/app.controller.ts

# Format code with Prettier
pnpm format

# Check code formatting (no pre-defined script)
npx prettier --check "src/**/*.ts" "test/**/*.ts"

# Type checking
npx tsc --noEmit
```

### Dependencies

```bash
# Install new dependency
pnpm add package-name

# Install dev dependency
pnpm add --save-dev package-name

# Update dependencies
pnpm update

# Check for outdated packages
pnpm outdated
```

## Code Style Guidelines

### Imports & Formatting

- Use relative imports for internal modules
- Group imports: Node.js → External packages → Internal modules → Relative imports
- Use `import`/`export` syntax, never `require()`
- Remove unused imports
- Prettier: 2-space indentation, single quotes, trailing commas, auto line endings
- ESLint: typescript-eslint with recommendedTypeChecked config

### Naming Conventions

- **Files**: kebab-case (`notification.service.ts`)
- **Classes**: PascalCase (`NotificationService`)
- **Methods/Functions**: camelCase (`sendNotification()`)
- **Variables**: camelCase (`notificationTemplate`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Interfaces**: PascalCase (no I prefix: `NotificationTemplate`)

### Type Safety & Error Handling

- Use TypeScript types, `any` is allowed but discouraged
- Prefer explicit return types for public methods
- Use enums for related constants, DTOs for validation
- Enable strict null checks in tsconfig
- Use NestJS built-in exceptions (`@nestjs/common`)
- Create custom exceptions for domain-specific errors
- Include meaningful error messages and proper HTTP status codes

### Services & Modules

- Use `@Injectable()` for services
- Inject dependencies via constructor
- Keep services single responsibility
- Organize by feature/domain with separate modules
- Use `@Global()` only when necessary
- Properly import/export modules

### Testing

- Unit tests co-located with source files (`.spec.ts` suffix)
- E2E tests in `test/` directory (`.e2e-spec.ts` suffix)
- Use Jest framework, mock external dependencies
- Test both success and failure scenarios
- Aim for >80% coverage

## Git Workflow

This repository enforces Git Flow with Lefthook hooks:

### Branch Naming

- `feature/<description>` - New features
- `bugfix/<description>` - Bug fixes
- `hotfix/<description>` - Production hotfixes
- `release/<version>` - Release preparation

### Protected Branches

Direct pushes blocked to: `main`, `master`, `develop`, `release/*`, `hotfix/*`

### Commit Format (Conventional Commits)

```
<type>[optional scope]: <description>

Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert
Max description length: 50 characters

Examples:
  feat(notification): add email template support
  fix: resolve memory leak in rate limiter
```

### Pre-commit Hooks

- Lint, test, and check formatting on staged files
- Validate commit message format

## Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and run tests: `pnpm test`
3. Check formatting: `npx prettier --check "src/**/*.ts"`
4. Lint code: `pnpm lint`
5. Commit with conventional format: `git commit -m "feat: add new feature"`
6. Push and create PR (never push to protected branches)

**Important:** Use pnpm (not npm). Run tests and linting before committing (enforced by hooks). Use NestJS CLI: `nest generate module notification`
