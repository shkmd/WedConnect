# WedConnect

WedConnect is an India-focused wedding-professional discovery and introduction platform. It does not process wedding-service bookings or payments.

This repository currently contains the approved **Module 1 foundation** only: a pnpm/Turborepo workspace, Next.js web app, Expo mobile app, NestJS API, Supabase-Queues-ready worker, shared packages, managed-service configuration, CI, and health checks. Product domains are intentionally deferred to later approval-gated modules.

## Requirements

- Node.js 20.19+
- pnpm 10.17+
- A Supabase project with PostGIS and `pg_trgm` enabled
- Supabase Queues (`pgmq`) and Cron (`pg_cron`) enabled

## Start locally

```bash
cp .env.example .env
pnpm install --frozen-lockfile
pnpm dev
```

Replace the placeholder Supabase values in `.env` before starting. See `documentation/operations/managed-development-services.md` for setup details.

Web runs at `http://localhost:3000`; API liveness and readiness are at `http://localhost:4000/api/v1/health/live` and `/ready`.

## Verify

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

See `documentation/modules/module-1-foundation.md` for scope and evidence expectations.
