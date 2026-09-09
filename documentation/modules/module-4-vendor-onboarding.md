# Module 4 — Vendor onboarding

## Delivered

- Vendor business registration with eight professional types and automatic owner membership.
- Resumable draft progress, step number, completion percentage, and strict ownership checks.
- Primary/secondary categories, base city, city/locality service areas, services, packages, and versioned terms acceptance.
- Aggregated profile preview before submission.
- Submission completeness validation with an explicit missing-fields response.
- Moderation queue and `APPROVED`, `REJECTED`, or `CHANGES_REQUESTED` decisions with immutable transition history.
- RLS and revoked direct client access across all eight Module 4 tables.

Portfolio uploads and verification evidence are intentionally deferred to Module 5.

## Vendor API

All routes require Supabase authentication and business membership:

- `POST /api/v1/vendors/businesses`
- `GET /api/v1/vendors/businesses/:id/onboarding`
- `PATCH /api/v1/vendors/businesses/:id`
- `PUT /api/v1/vendors/businesses/:id/categories`
- `PUT /api/v1/vendors/businesses/:id/service-areas`
- `POST /api/v1/vendors/businesses/:id/services`
- `POST /api/v1/vendors/businesses/:id/packages`
- `POST /api/v1/vendors/businesses/:id/terms`
- `GET /api/v1/vendors/businesses/:id/preview`
- `POST /api/v1/vendors/businesses/:id/submit`

Submission requires a description, active base city, primary category, at least one service area, at least one active service, and a terms acceptance.

## Moderation API

Requires `vendor.moderate`, granted to verifier, moderator, and super-admin roles:

- `GET /api/v1/admin/vendor-submissions`
- `POST /api/v1/admin/vendor-submissions/:id/decision`

## Operations

Migration: `20260815160000_vendor_onboarding`. It includes rollback SQL, was applied transactionally, and was recorded with its SHA-256 checksum in `_prisma_migrations`.

Rollback destroys Module 4 business data and requires an export plus explicit approval.
