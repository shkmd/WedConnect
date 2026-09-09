# Module 10 — Monetization

Implemented configurable plans, subscriptions, Razorpay order/webhook foundations, lead-credit packs, immutable fulfilment ledger entries, invoices, promotion targeting, caps, and sponsored disclosure.

Payment fulfilment is server-side only. Webhooks use the unparsed raw request body, HMAC-SHA256 validation, provider event idempotency, and captured-payment checks. Without `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`, checkout safely returns unavailable and cannot grant entitlements.

WedConnect does not charge wedding booking commission.

Web routes: `/vendor/billing` and `/vendor/promotions`.
