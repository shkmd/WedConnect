# Backup and restoration runbook

1. Enable Supabase production backups and point-in-time recovery for the production project. Record retention and region in the change ticket.
2. Before a restoration exercise, create an isolated recovery project. Never restore over production for a test.
3. Restore the selected backup/PITR timestamp, then rotate recovered service credentials.
4. Run all Prisma migration checksums and query table, RLS, trigger, bucket, and row-count invariants.
5. Run API readiness, authentication, search, consent, credit-ledger, evidence-access, and webhook replay tests.
6. Verify private storage objects with sampled signed URLs; verify public objects contain no private evidence.
7. Record recovery point objective, recovery time, deviations, approver, and evidence. Delete the recovery project according to the incident ticket.

Required launch gate: a successful isolated restore rehearsal with measured RPO/RTO. This repository cannot enable or execute the managed Supabase backup itself without production-owner authorization.
