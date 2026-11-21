# Database migrations (DRAFT)

Status: `0001`-`0003` are applied to the owner's Supabase project and pass `tests/smoke.sql`. `0004` and `0005` are drafts, parsed for syntax only; apply them, then run `tests/smoke_0004_0005.sql`.

| File | Adds |
|---|---|
| `0001_core_identity.sql` | workspaces, staff roles, `app.has_role()`, append-only `audit_events` |
| `0002_catalogue_and_media.sql` | collections, artworks, variants, edition runs, `assets`, `artwork_images`, `media_slots`, publish guard |
| `0003_customers_orders_storefront.sql` | customers, consents, enquiries, orders, reservations, edition numbers, `storefront_*` public views, RLS |
| `0004_storage_buckets.sql` | buckets `artwork-masters` (private), `artwork-public` (public read), `documents` (private) and their access policies |
| `0005_publish_guard_and_grants.sql` | publish guard now also protects published works when images or variants change; grants signed-in users access to the `app` schema (without it every staff policy would fail) |

Deliberately not included (blocked on open questions in `docs/12`): payments and webhooks, invoices and tax, shipping rates.

Rules these drafts enforce: money is integer ZAR cents; timestamps are `timestamptz`; no public access to CRM tables
(the website reads `storefront_*` views only); print masters are never public; an artwork cannot be published without a
cover image; an edition number cannot be allocated until the order has a verified `paid_at`.

Before applying: review with the owner, answer the open questions in `docs/12 §7`, test in a Supabase branch, and write RLS tests.
