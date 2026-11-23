# Database migrations (DRAFT)

Tests: `pnpm --filter @lgndry/database test:db` runs 0001-0003 and 0005-0013 on a throwaway in-memory Postgres and checks the catalogue rules and permissions (no Supabase needed).

Status: `0001`-`0003` are applied to the owner's Supabase project and pass `tests/smoke.sql`. `0004` and `0005` are drafts, parsed for syntax only; apply them, then run `tests/smoke_0004_0005.sql`.

| File | Adds |
|---|---|
| `0001_core_identity.sql` | workspaces, staff roles, `app.has_role()`, append-only `audit_events` |
| `0002_catalogue_and_media.sql` | collections, artworks, variants, edition runs, `assets`, `artwork_images`, `media_slots`, publish guard |
| `0003_customers_orders_storefront.sql` | customers, consents, enquiries, orders, reservations, edition numbers, `storefront_*` public views, RLS |
| `0004_storage_buckets.sql` | buckets `artwork-masters` (private), `artwork-public` (public read), `documents` (private) and their access policies |
| `0007_catalogue_save_and_scheduling.sql` | atomic `save_artwork()` and `delete_draft_artwork()`; scheduled works go live on their date; drafts may have empty alt text (the guard requires it to publish) |
| `0008_storefront_views_for_the_website.sql` | the website's read views: `image_id` on picture copies, and a collection shows as soon as it has a live work |
| `0009_website_intake.sql` | `intake_enquiry()` and `intake_newsletter()`: the only way a website form reaches the CRM (service role only; validates, refuses floods, records newsletter consent) |
| `0010_staff_add_customers.sql` | lets the owner and studio managers add a customer by hand (insert only; customers are archived, never deleted) |
| `0011_bookings.sql` | photography bookings: one row per request, the pipeline statuses, milestone times, who may see or change them. No prices, quotes or deposits yet |
| `0012_customer_messages.sql` | the written record of what was said to and by each customer (emails, calls, notes); append-only, owner and studio manager only |
| `0013_campaign_drafts.sql` | newsletter drafts. The status can only be draft or archived, so nothing can be marked sent until sending is built |
| `0005_publish_guard_and_grants.sql` | publish guard now also protects published works when images or variants change; grants signed-in users access to the `app` schema (without it every staff policy would fail) |

Deliberately not included (blocked on open questions in `docs/12`): payments and webhooks, invoices and tax, shipping rates.

Rules these drafts enforce: money is integer ZAR cents; timestamps are `timestamptz`; no public access to CRM tables
(the website reads `storefront_*` views only); print masters are never public; an artwork cannot be published without a
cover image; an edition number cannot be allocated until the order has a verified `paid_at`.

Before applying: review with the owner, answer the open questions in `docs/12 §7`, test in a Supabase branch, and write RLS tests.
