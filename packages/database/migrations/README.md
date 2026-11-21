# Database migrations (DRAFT)

Status: **drafts. Not applied to any database.** Parsed for SQL syntax only; not executed against Postgres and not yet reviewed against Supabase.

| File | Adds |
|---|---|
| `0001_core_identity.sql` | workspaces, staff roles, `app.has_role()`, append-only `audit_events` |
| `0002_catalogue_and_media.sql` | collections, artworks, variants, edition runs, `assets`, `artwork_images`, `media_slots`, publish guard |
| `0003_customers_orders_storefront.sql` | customers, consents, enquiries, orders, reservations, edition numbers, `storefront_*` public views, RLS |

Deliberately not included (blocked on open questions in `docs/12`): payments and webhooks, invoices and tax, shipping rates.

Rules these drafts enforce: money is integer ZAR cents; timestamps are `timestamptz`; no public access to CRM tables
(the website reads `storefront_*` views only); print masters are never public; an artwork cannot be published without a
cover image; an edition number cannot be allocated until the order has a verified `paid_at`.

Before applying: review with the owner, answer the open questions in `docs/12 §7`, test in a Supabase branch, and write RLS tests.
