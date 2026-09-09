# Module 7 — Customer requirements and leads

## Delivered

- Customer requirement form and authenticated API with mandatory city, category, future event date, and meaningful description.
- Duplicate detection, five-per-day spam control, optional customer-selected vendors, and a maximum of five matched vendors.
- Eligibility-based matching to active, approved, public vendors serving the requested city/locality and category.
- Redacted vendor previews that exclude phone, email, exact venue, and the full description.
- Recipient-specific contact consent storing exact wording, version, SHA-256 hash, timestamp, customer, vendor recipient, and shared fields.
- Contact reveal from Supabase Auth only after the matching immutable consent grant.
- Lead statuses, vendor responses, invalid-lead reports, admin refund review, and notification outbox events.
- Atomic first-response credit deduction and immutable credit ledger; later responses on the same lead are not charged again.
- RLS and revoked direct client access across all eight Module 7 tables.

## API

Customer:

- `POST /api/v1/requirements`
- `GET /api/v1/requirements/mine`
- `POST /api/v1/requirements/:id/contact-grants`

Vendor membership required:

- `GET /api/v1/vendors/businesses/:businessId/leads`
- `POST /api/v1/vendors/businesses/:businessId/leads/:id/view`
- `POST /api/v1/vendors/businesses/:businessId/leads/:id/respond`
- `GET /api/v1/vendors/businesses/:businessId/leads/:id/contact`
- `PATCH /api/v1/vendors/businesses/:businessId/leads/:id/status`
- `POST /api/v1/vendors/businesses/:businessId/leads/:id/invalid-report`

Administration requires `credits.manage`:

- `POST /api/v1/admin/lead-credits/grant`
- `POST /api/v1/admin/lead-credits/refund-review`

## Web previews

- `/requirements/new`
- `/vendor/leads`

They demonstrate the privacy boundary without creating fictional users or leads. Saving requires an authenticated customer/vendor session.

## Notifications

Lifecycle events are written to the notification outbox. Actual email, SMS, WhatsApp, or push delivery remains disabled until providers and templates are configured; private contact data is never placed in outbox payloads.

## Operations

Migration `20260816040000_customer_requirements_leads` was applied transactionally and recorded in `_prisma_migrations`. Rollback is destructive and requires export plus explicit approval.
