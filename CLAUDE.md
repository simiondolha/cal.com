# CLAUDE.md

## Build & Development Commands

```bash
# Install dependencies
yarn

# Quick start with Docker (Postgres + test users)
yarn dx

# Development server
yarn dev

# Build for production
yarn build

# Lint code
yarn lint
yarn lint:fix

# Type checking
yarn type-check

# Run unit tests
yarn test                    # Run all unit tests
yarn tdd                     # Watch mode for TDD

# Run a single test file
TZ=UTC vitest run path/to/test.test.ts

# E2E tests (requires yarn db-seed first)
yarn test-e2e               # All E2E tests
yarn e2e                    # Just playwright tests
npx playwright install      # Install browsers if needed

# Database operations
yarn prisma studio          # Open Prisma Studio
yarn db-seed                # Seed database
yarn workspace @calcom/prisma db-migrate  # Run migrations (dev)
yarn workspace @calcom/prisma db-deploy   # Run migrations (prod)
```

## Architecture Overview

Cal.com is a **Turborepo monorepo** with the following structure:

### Apps (`apps/`)
- **web**: Main Next.js application (pages, modules, API routes)
- **api/v1, api/v2**: REST API applications

### Core Packages (`packages/`)
- **prisma**: Database schema, migrations, seed data
- **trpc**: tRPC routers and procedures for type-safe API calls
- **lib**: Shared utilities (availability calculations, date handling, constants)
- **ui**: Shared React components (design system)
- **features**: Feature-specific code organized by domain (schedules, bookings, webhooks, etc.)
- **platform/atoms**: Reusable React components for Cal.com Platform
- **app-store**: Integration apps (Google Calendar, Zoom, Stripe, etc.)
- **ee**: Enterprise Edition features (requires commercial license)
- **types**: Shared TypeScript type definitions

### Key Architectural Patterns

**Data Flow**: Pages/Modules → tRPC procedures → Services → Repositories → Prisma

**Form State**: React Hook Form with `useFormContext` for nested components

**Styling**: Tailwind CSS with class utilities via `@calcom/ui/classNames`

**Localization**: All user-facing text uses `t()` from `useLocale()` hook

## Code Quality Standards

- **Early returns**: Throw/return early for null-checks to reduce nesting
- **Composition over prop drilling**: Use React children pattern
- **Prisma queries**: Always use `select` (not `include`) to fetch only needed fields. Never return `credential.key` from API endpoints
- **Performance**: Avoid O(n²) logic; prefer O(n log n) or O(n). Minimize Day.js in hot paths—use `.utc()` or native Date when possible
- **No circular references**: Never introduce circular imports

## File Naming Conventions

- **Repositories**: `Prisma<Entity>Repository.ts` (e.g., `PrismaAppRepository.ts`)
- **Services**: `<Entity>Service.ts` (e.g., `MembershipService.ts`)
- **Tests**: `*.test.ts` or `*.spec.ts`
- **Types**: `*.types.ts`

Avoid dot-suffixes like `.service.ts` or `.repository.ts` for new files.

## API Changes

When modifying API v1 or v2 endpoints:
- Never introduce breaking changes on existing endpoints
- Create new versioned endpoints instead
- Keep old endpoints functional

## Testing

- Unit tests use Vitest (`yarn test`)
- E2E tests use Playwright (`yarn test-e2e`)
- Set `NEXTAUTH_URL=http://localhost:3000` for E2E tests
