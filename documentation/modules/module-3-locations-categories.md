# Module 3 — Locations and categories

## Delivered

- Additive Prisma migration with rollback SQL for hierarchical locations, categories, and versioned category field definitions.
- PostGIS geography centroid generated from validated latitude/longitude and a GiST spatial index.
- Seed hierarchy: India → Tamil Nadu → Coimbatore District → Coimbatore → 10 representative localities.
- 34 initial wedding-service categories and active example fields for photography, venues, and catering.
- Public read APIs plus permission-gated admin create/update and field-version APIs.
- RLS enabled and direct `anon`/`authenticated` table access revoked; access is mediated by the Nest API.

## API

Public:

- `GET /api/v1/locations/countries`
- `GET /api/v1/locations/:parentId/children`
- `GET /api/v1/locations/cities/:slug`
- `GET /api/v1/locations/cities/:slug/localities`
- `GET /api/v1/categories`
- `GET /api/v1/categories/:slug`
- `GET /api/v1/categories/:slug/fields`

Admin (bearer/cookie authentication plus permission):

- `POST /api/v1/admin/locations` and `PATCH /api/v1/admin/locations/:id` — `locations.manage`
- `POST /api/v1/admin/categories` and `PATCH /api/v1/admin/categories/:id` — `taxonomy.manage`
- `POST /api/v1/admin/categories/:id/fields` creates the next immutable field version; activating it archives the prior active version.
- `PATCH /api/v1/admin/categories/fields/:id/archive`

## Operations

Migration: `20260815120000_locations_categories`. It was applied transactionally and recorded in `_prisma_migrations` with the SHA-256 checksum because the managed Supabase pooler's TLS path is incompatible with the local Prisma migration engine. Application queries use the supported PostgreSQL driver adapter.

Rollback is destructive to Module 3 taxonomy data and must only be run after an export and explicit approval.
