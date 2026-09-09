# Module 2 — Identity and RBAC

## Scope

Supabase Auth is the authentication authority for mobile OTP, access/refresh sessions, and future TOTP MFA. WedConnect owns application-user state, scoped role assignments, permissions, immutable consent history, OTP abuse metadata, and admin MFA policy state.

## User stories and acceptance criteria

- Customers and vendor owners can request and verify an India-compatible E.164 mobile OTP without self-assigning privileged roles.
- Web verification stores tokens in HTTP-only cookies; mobile verification returns tokens for Expo SecureStore.
- Protected APIs validate access tokens with Supabase Auth and load active application roles.
- Authorization evaluates server-side permission grants; client navigation is never authoritative.
- Consent grants and withdrawals are append-only and retain exact notice wording, version, SHA-256 hash, purpose, recipient, shared fields, source, and timestamp.
- OTP requests are limited to five recorded successful requests per phone hash in ten minutes, in addition to Supabase provider controls.
- Administrative accounts have a policy record requiring MFA; enforcement on admin routes begins when the first admin route is introduced.

## Database changes

Migration `20260815080000_identity_rbac` creates `app_users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `consent_records`, `otp_security_events`, and `admin_mfa_policies`. `app_users.id` references `auth.users.id`; WedConnect does not alter Supabase Auth tables. Six system roles and seven foundational permissions are seeded. User-facing identity tables enable RLS, while server-owned authorization tables are revoked from `anon` and `authenticated`.

## APIs

- `POST /api/v1/auth/otp/request`
- `POST /api/v1/auth/otp/verify`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/consent`
- `POST /api/v1/consent`
- `POST /api/v1/consent/:id/withdraw`

OpenAPI discovers these controllers through Nest Swagger. Typed client generation is deferred until response DTOs are stabilized with the web/mobile identity UI in the next approved increment.

## Security and privacy

Phone numbers are transmitted only to Supabase Auth and are never stored in WedConnect tables or logs. OTP abuse records use HMAC-SHA-256 with `PII_HASH_SECRET`. Only `CUSTOMER` and `VENDOR_OWNER` are self-selectable; staff and privileged roles require an audited future administrative grant. Web cookies are HTTP-only, with stricter refresh-token path and SameSite policy. Mobile tokens must be stored in Expo SecureStore.

The configured `SUPABASE_SECRET_KEY` is not used by Module 2 and must never be exposed to web/mobile bundles. It may be removed from local configuration until a narrowly scoped server-only administrative requirement is approved.

## Analytics

No phone number, token, user email, or consent text is sent to analytics. Future typed events may record `otp_requested`, `otp_verified`, `role_context_selected`, `consent_granted`, and `consent_withdrawn` with opaque user identifiers only.

## Remaining risks

- Supabase Phone Auth needs an approved SMS provider and template before live OTP E2E verification.
- Refresh endpoint, logout/revocation UI, and admin TOTP enrollment screens require web/mobile application work; token issuance and policy storage foundations are present.
- The configured direct database URL points to a Supabase pooler, so this environment applied the checked-in SQL transactionally through the PostgreSQL driver and recorded Prisma migration metadata. A true direct/session URL should be corrected before the next migration.
- Object-scoped vendor authorization becomes enforceable when vendor businesses are introduced in Module 4.

## Approval gate

Stop after verification. Module 3 must not begin without approval.
