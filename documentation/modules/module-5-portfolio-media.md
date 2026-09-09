# Module 5 — Portfolio and media

## Delivered

- Private Supabase Storage bucket with signed direct uploads, 10-minute upload intents, MIME/type validation, 20 MB image and 50 MB overall limits, and mandatory content-rights declaration.
- Portfolio formats for single images, albums, short videos, and reels, including captions, category, event type, city, tags, related package, ordering, and cover selection.
- Supabase Queue-backed processing worker with file-signature checks, EICAR test-signature quarantine, retry handling, image metadata stripping, WebP resizing, and thumbnail generation.
- Moderation queue and approval/rejection history. Media cannot be published unless processing is `READY` and moderation is `APPROVED`.
- Archive controls, signed public rendering URLs, and copyright reports.
- RLS and revoked direct client access on all six Module 5 tables.

## Important video-runtime constraint

The video workflow, validation, queuing, status, retry, privacy, and publication gates are implemented. Transcoding remains safely `FAILED` and private on this workstation because FFmpeg is not installed. An attempted bundled FFmpeg dependency was rejected by the workspace supply-chain policy due its post-install binary download. Production must use an explicitly approved FFmpeg runtime or managed transcoding service before videos can reach `READY`.

The built-in EICAR guard is not a replacement for a production ClamAV or managed malware scanner.

## Main API

- `POST /api/v1/vendors/businesses/:businessId/media/upload-intents`
- `POST /api/v1/vendors/businesses/:businessId/media/upload-intents/:intentId/complete`
- `POST /api/v1/vendors/businesses/:businessId/media/retry/:mediaId`
- `POST /api/v1/vendors/businesses/:businessId/portfolio`
- `POST /api/v1/vendors/businesses/:businessId/portfolio/:postId/publish`
- `PATCH /api/v1/vendors/businesses/:businessId/portfolio/:postId/archive`
- `GET /api/v1/admin/media/queue` and `POST /api/v1/admin/media/:mediaId/decision` — requires `media.moderate`
- `GET /api/v1/public/vendors/:slug/portfolio`
- `POST /api/v1/public/copyright-reports`

## Operations

Migration `20260815200000_portfolio_media` was applied transactionally and recorded in `_prisma_migrations`. It creates the `media_processing` Supabase Queue and includes destructive rollback SQL requiring export and explicit approval.
