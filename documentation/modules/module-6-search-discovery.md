# Module 6 — Search and discovery

## Delivered

- City and category discovery with eligible-vendor counts.
- Hard eligibility gate: approved and publicly visible business, active owner account, matching category, and matching city/locality service area.
- Shareable GET filters for text, city, locality, category, event date, price range, rating, verification, languages, tradition, style, outstation availability, and dynamic category fields.
- Organic scoring using location precision, primary-category relevance, completion, verification, rating, approved portfolio volume, response rate, and recent activity.
- Explicit `rating`, `price`, `recent`, and relevance sorting.
- Sponsored inventory returned separately, labelled `Sponsored`, globally frequency-capped per day, and never injected into organic rank.
- SEO listing and public vendor URLs: `/{city}/{category}` and `/{city}/{category}/{vendor-slug}`, with canonical metadata and structured data.
- PostgreSQL partial, trigram, GIN, and price indexes for discovery paths.

Event-date is preserved in shareable URLs and response metadata. Availability filtering will become enforceable when the availability model is introduced in its scheduled module; it is not falsely treated as confirmed today.

## API

- `GET /api/v1/discovery/cities`
- `GET /api/v1/discovery/categories?city=coimbatore`
- `GET /api/v1/discovery/search?city=coimbatore&category=photography`
- `GET /api/v1/discovery/:city/:category/:vendor`
- `POST /api/v1/admin/sponsored-placements` — requires `sponsored.manage`

The search response always separates `sponsored` and `organic` arrays.

## Operations

Migration `20260816000000_search_discovery` was applied transactionally and recorded in `_prisma_migrations`. RLS is enabled and direct client access revoked for all three discovery tables. Rollback is destructive and requires export plus explicit approval.
