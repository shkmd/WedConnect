# Module 8 — Shortlists and reviews

Implemented customer-owned vendor shortlists, comparison, expiring share links, verified review eligibility, vendor replies, and review moderation.

## Privacy and trust rules

- Only approved, publicly visible vendors can be saved.
- A customer can compare two to four vendors already present in their own shortlist.
- Share tokens are random, stored only as SHA-256 hashes, expire within 90 days, and can be revoked.
- Shared views contain public vendor data and shortlist notes; no contact or private requirement fields are included.
- Reviews require an authenticated customer and a real lead recipient in `RESPONDED`, `CONTACT_SHARED`, `IN_DISCUSSION`, or `CLOSED` state.
- Each lead interaction can produce at most one review.
- Reviews are pending until a moderator approves them. Rejections and hiding require a reason and every decision is audited.
- Vendor replies require active membership and can only be added to published reviews.

## Routes

- `POST/GET /api/v1/shortlists`
- `POST/DELETE /api/v1/shortlists/:id/items`
- `POST /api/v1/shortlists/:id/compare`
- `POST/DELETE /api/v1/shortlists/:id/shares`
- `GET /api/v1/shared/shortlists/:token`
- `POST /api/v1/vendors/businesses/:businessId/reviews`
- `POST /api/v1/vendors/businesses/:businessId/reviews/:reviewId/reply`
- `GET /api/v1/vendors/:slug/reviews`
- `GET /api/v1/admin/reviews/queue`
- `POST /api/v1/admin/reviews/:id/decision`

## Web routes

- `/shortlists`
- `/shortlists/shared/:token`
- `/vendor/reviews`
