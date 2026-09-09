# WedConnect threat model

| Threat | Primary controls | Residual launch action |
|---|---|---|
| Fake vendors | OTP identity, moderated onboarding, scoped verification, qualified badges | Staff operating procedure and sampling |
| Account takeover | Rotating Supabase sessions, revocation, HttpOnly cookies, SecureStore, OTP limits | Enable mandatory admin MFA in Supabase |
| Stolen portfolios | Rights declaration, private originals, moderation, copyright reports | Configure malware provider and escalation SLA |
| Customer-data misuse | Redacted leads, explicit per-vendor contact consent, immutable contact grants | Quarterly access review |
| Lead scraping | Authentication, membership checks, rate limits, preview redaction | Edge/WAF bot rules |
| Review manipulation | Verified interaction eligibility, one review per lead, moderation audit | Abuse heuristics after production data exists |
| Admin abuse | Scoped RBAC, immutable audit logs, assigned evidence access | Break-glass account process and MFA |
| Payment webhook fraud | Raw-body HMAC, captured status, idempotent event IDs, immutable credit ledger | Razorpay test-mode certification |
| Malicious uploads | MIME/size allowlists, quarantine states, private buckets | Connect malware scanner before accepting public uploads |
| Enumeration | Generic auth responses, UUIDs, rate limits, no PII in errors | External penetration test |

Trust boundaries: public clients → API; API/worker → Supabase; API → Razorpay; staff roles → restricted moderation evidence. Secrets remain server-side only.
