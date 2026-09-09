# Module 1 — Foundation handoff

## Scope delivered

This module initializes the WedConnect monorepo and only its technical foundation: pnpm/Turborepo, Next.js web, Expo mobile, NestJS API, worker process, shared domain/design packages, managed Supabase/PostGIS/Queues/Cron configuration, CI, API documentation, and health endpoints. Marketplace feature code is intentionally absent.

## User stories and acceptance criteria

- Engineers can install, lint, typecheck, test, and build all workspaces from the root.
- Operators have API liveness (`/api/v1/health/live`) and dependency readiness (`/api/v1/health/ready`) endpoints.
- Developers can connect to isolated Supabase environments; PostGIS, `pg_trgm`, `pgmq`, and `pg_cron` have a checked-in enablement script.
- Web and mobile show accessible, truthful foundation states instead of mock functionality.
- CI uses a frozen lockfile and runs lint, typecheck, tests, and production builds.

## Database and APIs

No application tables or migrations are introduced. Prisma begins with Module 2, the first data-owning module. Supabase initialization enables only the required PostGIS and `pg_trgm` extensions.

API surface:

- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- OpenAPI/Swagger UI at `/api/docs`

## Security and privacy

- API cross-origin requests are denied until approved origins exist.
- Web sends baseline anti-clickjacking, MIME-sniffing, referrer, and permission headers.
- Health checks expose status and latency only, never connection data.
- Environment examples contain local-only values and no secrets.
- No product analytics or PII collection exists in this module.

## UI states

The web and mobile screens are intentional empty/readiness states. The required marketplace disclaimer is present on web. Feature loading, success, and error states will be implemented by their owning modules.

## Verification evidence

Executed on Windows with the Codex bundled Node 24.19 and pnpm 11.19 runtime:

- Dependency install and supply-chain policy check: passed; 1,142 lockfile entries.
- Lint: passed in all six buildable workspaces.
- Typecheck: passed in all six buildable workspaces.
- Tests: passed; API 2 E2E assertions and worker 1 unit assertion. Empty foundation packages use `--passWithNoTests` intentionally.
- API production build: passed.
- Worker production build: passed.
- Next.js production build: passed; four static pages generated, home first-load JS reported at 102 kB.
- Expo production web export: passed; 682 modules bundled.

Live managed-service verification requires project credentials and has not been run. Connection strings are represented only by safe placeholders; the isolated readiness E2E test is verified.

## Changed areas

- Root workspace/tooling configuration and lockfile
- `apps/api`, `apps/web`, `apps/mobile`, `apps/worker`
- `packages/domain-types`, `packages/design-tokens`
- `infrastructure/supabase`
- `.github/workflows/ci.yml`
- Foundation documentation

## Remaining risks

- Supabase provisioning plus live dependency readiness remains unverified until a valid project connection is supplied through a secret store.
- Native Android/iOS binaries are deferred to Module 11; this module verifies the Expo app by typecheck and web export.
- Next.js reports that its dedicated ESLint plugin is not yet configured. Current ESLint checks pass; framework-specific lint rules should be added before feature UI work expands.
- Production environment validation must make `DATABASE_URL` and `REDIS_URL` mandatory; isolated test readiness permits `not_configured` dependencies by design.

## Approval gate

Stop here. Module 2 (Identity and RBAC) must not begin until this foundation is approved.
