# Production launch checklist

- [ ] Production Supabase project, regional placement, PITR, restore rehearsal, and alerting approved.
- [ ] Domain, TLS, CSP, CORS, Universal Links, App Links, and DNS validated.
- [ ] Admin MFA and break-glass procedure tested.
- [ ] Razorpay test-mode end-to-end payment, captured webhook, refund, replay, and failure paths certified.
- [ ] Malware scanning provider connected; FFmpeg native dependency approved or video uploads disabled.
- [ ] Privacy notice, terms, grievance contact, retention schedule, DPA/vendor register, and deletion/export SLAs approved.
- [ ] External penetration test and dependency/security scan have no open critical/high findings.
- [ ] WCAG 2.2 AA audit includes keyboard, screen reader, contrast, zoom, motion, and mobile touch targets.
- [ ] Core Web Vitals measured on production-like infrastructure at p75: LCP ≤2.5s and CLS ≤0.1.
- [ ] Logs, uptime, database, queue, webhook, error-rate, latency, credit, and business KPI alerts tested.
- [ ] EAS signing, FCM/APNs, store privacy disclosures, screenshots, review accounts, and release rollback approved.

Unchecked external gates mean the system is technically hardened but not authorised for public production launch.
