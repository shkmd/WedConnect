# Managed development services

Module 1 uses Supabase PostgreSQL, Queues, and Cron instead of local Docker or Redis services. Database and queue access remain behind application interfaces so another provider can be introduced later. Supabase Auth, Storage, Realtime, and Edge Functions are not application dependencies at this stage.

## Supabase PostgreSQL

1. Create a Supabase project in the approved region.
2. Open the SQL editor and run `infrastructure/supabase/enable-extensions.sql`.
3. Copy the transaction-pooler connection string into `DATABASE_URL` for ordinary application runtime.
4. Copy the direct database connection string into `DIRECT_DATABASE_URL` for migrations and operations that require a session connection.
5. Ensure both URLs require TLS. Never commit their passwords.

PostGIS is installed in the `extensions` schema. Future SQL and Prisma migrations must either schema-qualify PostGIS types/functions where required or configure a safe `search_path`. Module 2 will add Prisma and environment validation with the first application schema.

## Supabase Queues and Cron

1. Enable Queues from Supabase Dashboard → Integrations → Queues, or run the checked-in extension script.
2. Use durable/basic queues for business jobs. Do not expose queue schemas through the public Data API; only the server worker consumes them through PostgreSQL.
3. Enable Cron from Dashboard → Integrations → Cron for recurring retention and maintenance jobs.
4. Keep job handlers idempotent and archive or delete messages only after successful processing.

## Environment isolation

Use separate Supabase projects for development, staging, and production. Preview environments must never reuse production credentials or data. Store deployed secrets in the hosting provider's secret manager and rotate them after suspected disclosure.

## Health checks

API readiness checks the configured PostgreSQL endpoint, which also hosts the queue extensions. It reports only dependency status and latency. A configured dependency failure returns HTTP 503; connection strings and provider errors are not returned to clients.
