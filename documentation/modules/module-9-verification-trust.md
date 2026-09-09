# Module 9 — Verification and trust

Implemented scoped vendor verification, private evidence, qualified public badges, reports, grievances, moderation, appeals, and immutable audit trails.

## Verification safeguards

- Scopes: identity, business, address, and portfolio.
- Evidence is stored in the private `verification-evidence` Supabase bucket, limited to PDF/JPEG/PNG and 10 MB.
- Vendors can access only cases belonging to businesses where they are active members.
- Verifiers can access only cases explicitly assigned to them.
- Every evidence view creates an immutable access record and a separate trust audit event.
- Evidence download URLs expire after five minutes.
- Badge wording states exactly what was checked and explicitly disclaims guarantees of quality, availability, safety, or future conduct.
- Badges support expiry and revocation.

## Trust workflows

- Reports cover copyright, impersonation, privacy, fake portfolio, fraud, review disputes, and other concerns.
- Authenticated users can submit and track grievances and appeals.
- Moderator resolutions and appeal decisions are permission-protected and audited.
- Trust audit and evidence-access rows cannot be updated or deleted at the database layer.

## Web routes

- `/vendor/trust-center`
- `/support/grievance`
- `/admin/trust`
