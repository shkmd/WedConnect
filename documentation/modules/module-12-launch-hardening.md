# Module 12 — Launch hardening

## Delivered

- API correlation IDs, structured redacted request logs, security headers, strict CORS, origin checks, and rate limits.
- Production Swagger disablement and normalized API errors.
- Privacy export, correction, deletion, and consent-withdrawal request workflow.
- PII-resistant product analytics with an allowlisted event vocabulary and anonymous-session hashing.
- Automated retention cleanup with execution audit records.
- Web CSP, transport/security headers, metadata, robots, sitemap, and keyboard skip navigation.
- Threat model, backup/restore, privacy/breach, and launch-checklist operating procedures.

## Release boundary

The codebase is technically hardened, but production release still requires the external evidence listed in `documentation/operations/launch-checklist.md`, including restore rehearsal, penetration testing, accessibility/device testing, production performance measurement, legal approval, payment certification, and signing/store configuration.

## Local endpoints

- Web: `http://localhost:3001`
- API readiness: `http://localhost:4000/api/v1/health/ready`
- Worker health: `http://localhost:4001/health/live`
- Mobile web preview: `http://localhost:3002`
