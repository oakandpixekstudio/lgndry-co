# 12 — Decision Log, Assumptions and Launch Blockers

**Status:** initial handoff. Claude should append concrete engineering decisions with dates, rationale and impact. Unknown business details are intentionally explicit; never substitute guesses for signed-off billing or legal details.

## 1. Confirmed design / product direction from this conversation

| ID | Decision | Basis |
|---|---|---|
| D-001 | CRM is named LGNDRY.Co Studio Desk and uses LGNDRY's editorial identity | approved HTML and screenshot |
| D-002 | Floating left charcoal sidebar on mineral-white canvas | approved floating HTML and latest screenshot |
| D-003 | Intelligence Center is the Overview screen | latest screenshot and user request |
| D-004 | Primary nav includes Overview, Customers, Orders, Editions, Bookings, Invoices, Enquiries, Inbox, Campaigns, Insights; Settings under Admin | latest screenshot |
| D-005 | Supports both e-commerce print sales and photography bookings | user requirement |
| D-006 | Prints use **invoice-first** order flow, not mandatory immediate website checkout | user conversation |
| D-007 | Invoice includes a convenient QR to payment and email includes clickable link | user conversation |
| D-008 | CRM should be built **from the actual prior HTML** and closely match the supplied screenshot | current handoff instruction |

## 2. Proposed engineering defaults (not verified business decisions)

| ID | Proposed default | Reconsider/approve before live trade |
|---|---|---|
| A-001 | One business workspace, active staff RBAC; not public multi-tenant SaaS | after strategy change only |
| A-002 | Next.js App Router + TypeScript + Supabase Postgres/Auth/Storage | confirm infrastructure provider/security review |
| A-003 | ZAR, `en-ZA`, `Africa/Johannesburg` | confirm all locations/currencies if expanded |
| A-004 | Edition reservation validity 72h | Owner/Finance: stock and demand policy |
| A-005 | Print orders paid in full before production/number allocation | Owner/Studio Manager |
| A-006 | Bookings require approved quote and verified deposit before confirmation | Owner/Studio Manager |
| A-007 | Hosted payment gateway with server-verified webhooks; provider abstracted until selected | Finance/Engineering |
| A-008 | Transactional email via a configured provider; inbound sync phased later | Studio Manager/Engineering |
| A-009 | PDF invoice generated from immutable snapshot; QR is secure URL | Finance/Engineering |
| A-010 | Initial intelligence alerts are deterministic, not AI predictions | Owner/Engineering |
| A-011 | Public guest checkout/request is supported without login | Owner/privacy review |
| A-012 | Legal/VAT invoice wording gated until issuer tax status confirmed | Finance/legal |
| A-013 | Role list/permission matrix in Security spec is proposed baseline | Owner/technical lead |

## 3. Business-specific open questions and safe default handling

| Question | Affected feature | Safe build-time action | Launch dependency |
|---|---|---|---|
| What is the registered legal trading entity, address and invoice contact? | Invoice/PDF | configurable, placeholder in dev only | **Yes** |
| Is LGNDRY VAT registered? Which VAT number and treatment? | Tax invoice | no assumed VAT; tax config disabled pending approval | **Yes** |
| Which provider handles SA hosted checkout, payment links and QR routing? | QR/payment | typed adapter + sandbox mock; production disabled | **Yes** |
| What is the approved refund/return/cancellation policy? | Checkout terms | policy placeholder linked in demo; public ordering gated until approved | **Yes** |
| What are shipping areas, rates, lead times and courier choices? | Order totals/fulfilment | configurable rates; no guessed live delivery fees | **Yes** |
| Which email service/domain does LGNDRY use? Is inbound API access available? | Inbox/outbound | transactional mock in dev; show not connected | Live outbound: **Yes**; inbound: P1 |
| How are edition runs defined across size/frame options? | Inventory and COA | shared run by default, explicit run ID; no invalid publication | **Yes** for published work |
| What are service packages, quote/deposit/cancellation policies? | Bookings | configurable services; quote review required | **Yes** |
| Are photographer crew/studio calendars centrally managed? | Calendar | internal resource model and no external sync until approved | Internal yes; external sync no |
| When should unpaid invoices expire/reminders fire? | Order reservation/reminders | configurable and off in production until approved | **Yes** |
| Who approves refunds and above what threshold? | Finance workflow | make-checker for elevated refund; defaults require approval | **Yes** |
| What is privacy notice/retention schedule? | Data governance | minimal data, role controls, retention placeholder and review | **Yes** |
| Which artwork photographs/brand font assets can be used commercially? | Design | existing demo placeholders; no unlicensed copies | **Yes** for final content |

## 4. Known source-to-target differences

| Feature | Legacy HTML | Screenshot / requirement | Build implication |
|---|---|---|---|
| Main headline | `A clearer picture.` | `The Intelligence Center.` | redesign overview heading / structure |
| Dashboard metrics | fixed illustrative values | dynamic KPI/intelligence | new authoritative read models |
| Main modules | Customers/Orders/Editions/Enquiries/Campaigns/Insights/Settings + Overview | adds Bookings, Invoices, Inbox | new pages, domain flows and nav items |
| Persistence | browser localStorage | real shared CRM | DB, auth, audit, migrations |
| Payments | manually changed order status in demo | invoice-first/QR/verified payments | secure backend and provider adapter |
| Edition number | demo status-change logic | allocate only after verified payment | transactional inventory allocator |
| Inbox | no integrated messages workspace | threaded Inbox | new entities and email adapter |
| Booking calendar | not present | appointment + workflow dashboard | service/crew/availability model |
| Tax/PDF | not in demo | real invoice document | immutable snapshot and configuration |

## 5. Engineering log template

Append:

```markdown
### DEC-YYYY-NNN — [Decision]
- Date:
- Owner:
- Context:
- Options considered:
- Selected choice:
- Impact on UI / schema / security / integrations:
- Tests / documents updated:
- Status: Proposed | Approved | Superseded
```

Do not treat this document as authority to invent merchant credentials, tax status or supplier legal identity. Those remain go-live gates.

## 6. Engineering decisions log

### DEC-2026-001 — Repository root is `LGNDRY-Co/`, with `apps/studio` and `apps/storefront`
- Date: 2026-11-19
- Owner: engineering (requested by the project owner)
- Context: the handoff package described `lgndry-platform/`. The client folder already holds the storefront, the handoff documents and two unrelated projects.
- Selected choice: the client folder itself is the monorepo root. `studio-desk/` became `apps/studio`, specs moved to `docs/`, references to `references/`. `apps/storefront` is the existing storefront repository (its own git history, GitHub remote and Vercel project, unchanged). **Pending:** the folder is still at `webites/lgndry-store/` because a dev server running there locks it. Stop that server, then run `mv webites/lgndry-store apps/storefront`.
- Impact: the monorepo git ignores `apps/storefront/`, `lgndrycp-site/`, `documents/` and `webites/`. `lgndrycp-site/` contains local credential files and is not part of this repository.
- Status: Approved

### DEC-2026-002 — TypeScript pinned to the 6.x line
- Context: TypeScript 7.0 installed by default, but `typescript-eslint` does not yet support it, which broke linting.
- Selected choice: `typescript@6`. Revisit when typescript-eslint supports 7.x.
- Status: Approved

### DEC-2026-003 — Studio runs on port 3100; storefront stays on 3000
- Context: both apps run locally at once.
- Status: Approved

### DEC-2026-004 — Demo mode defaults to ON
- Context: no database or provider exists yet. A default of "off" would require inventing figures or showing nothing.
- Selected choice: `DEMO_MODE` is on unless set to `false`. Outside demo mode the Intelligence Center shows an explicit "Live data not connected" state, not invented numbers.
- Status: Approved

### DEC-2026-005 — Fulfilment health computed from its own inputs
- Context: the target screenshot shows "98%" beside "31 / 32 orders", which does not agree (31/32 is 96.9%).
- Selected choice: the percentage is derived from the counts shown, so the demo displays 97%. Visual parity on this one figure is deliberately not preserved.
- Status: Approved

### DEC-2026-006 — Responsive KPI rail
- Context: seven cells fit at 1672px but not legibly at 1440px beside a 218px sidebar.
- Selected choice: 7 columns above 1500px, 4 below, 2 on phones. Text is not shrunk to illegibility.
- Status: Proposed (confirm with visual QA at 1440)

### DEC-2026-007 — Calendar status is explicit
- Context: spec requires tentative and confirmed bookings to be distinguishable and unconfirmed requests not to block dates.
- Selected choice: confirmed shoots are filled dots, tentative ones hollow, with a legend and per-day `aria-label`.
- Status: Approved

### DEC-2026-008 — Open item: edition run model
- Context: `06_DATA_MODEL.md` leaves how an edition run spans sizes and frames undecided.
- Selected choice: none yet. To be settled in Phase 3 before any artwork is published.
- Status: Proposed

### DEC-2026-009 — One catalogue database drives both the website and the Studio Desk
- Date: 2026-11-21
- Context: the storefront catalogue (21 works, 4 collections, sizes, finishes, surcharges, image file names) is hard-coded in `apps/storefront/src/lib/catalogue.ts`. The Studio Desk edits demo data held in memory. The two cannot stay aligned unless one database is the source of truth.
- Proposed choice: Supabase Postgres holds the catalogue. The Studio Desk is the only writer. The storefront reads through public, read-only views (`storefront_*`) and never touches CRM tables. Drafted in `packages/database/migrations/0001`–`0003` (not applied).
- Impact: `catalogue.ts` is replaced by queries. Storefront pages refresh when the Studio Desk publishes a change.
- Status: Proposed (needs owner approval of Supabase, A-002)

### DEC-2026-010 — Dynamic images: two kinds, masters private, derivatives public
- Date: 2026-11-21
- Context: the owner wants images to be updatable from the CRM. The website currently uses 7 files reused across 21 works.
- Proposed choice: (1) artwork images in `artwork_images` (cover, gallery, detail, room view; alt text required; focal point); (2) page images in `media_slots` keyed by name, e.g. `home.hero`. Print-resolution masters live in a private bucket. Only web derivatives (WebP/AVIF at 800, 1600 and 2400 px) are public. A work cannot be published without a cover image.
- Impact: new Studio Desk image editor on the Editions screen and a "Website images" area. Image processing job generates derivatives on upload.
- Status: Proposed

### DEC-2026-011 — Hybrid purchasing model
- Date: 2026-11-21
- Context: D-006 says prints are invoice-first. The storefront already has two modes per work: `buy` and `enquire`. The owner now describes the site as an e-commerce site.
- Proposed choice: open editions (printed to order) use website checkout. Limited and Collector's Editions are reserve-then-invoice or private enquiry. Both end in the same `orders` table.
- Impact: D-006 is narrowed, not reversed. Needs the owner to confirm which works are `buy` and which are `enquire`.
- Status: Proposed (owner to confirm; amends D-006)

### DEC-2026-012 — Orders: server prices, idempotent intake, reservation at checkout
- Date: 2026-11-21
- Proposed choice: the browser sends only variant ids and quantities. The server recomputes every price from `artwork_variants`. Stock is reserved when checkout starts (not when an item enters the cart) and expires (A-004 proposes 72h). Orders are created with an idempotency key. Edition numbers can only be allocated after the order has a verified `paid_at`; the database enforces this with a trigger.
- Impact: no order can become `paid` until a payment provider exists and its webhook is verified. Public checkout stays disabled until then.
- Status: Proposed

### DEC-2026-013 — Customer accounts: guest first, passwordless later
- Date: 2026-11-21
- Context: prints are high-value and bought rarely; the CRM already identifies customers by email.
- Proposed choice: phase A, guest checkout with an emailed order link (A-011). Phase B, optional passwordless "My orders" login (emailed link) showing orders, invoices, certificates and downloads; no passwords for customers. Phase C, a client portal for photography proofing. Customer logins are separate from staff logins; `customers.auth_user_id` links a customer to an account and RLS lets them read only their own orders.
- Impact: needs POPIA consent, data export and deletion handling, and an approved privacy notice.
- Status: Proposed

### DEC-2026-014 — Storefront and Studio live in different git histories
- Date: 2026-11-21
- Context: `apps/storefront` has its own history (remote `main` holds the storefront at the repo root; Studio Desk work lives on `studio-main`). Shared types are awkward across two histories.
- Proposed choice: decide between (a) bringing the storefront into the pnpm workspace so it can share `packages/domain` types, or (b) keeping it separate and having it consume only the public views and API. Not decided.
- Status: Open

## 7. Open questions added 2026-11-21 (catalogue, images, accounts)

| Question | Affected feature | Safe build-time action | Launch dependency |
|---|---|---|---|
| Do size and frame variants share one numbered edition run, or does each size have its own? | Edition numbers, stock, certificates | shared run by default (DEC-2026-008) | **Yes** for published limited works |
| For "Modishi wa Lebowa": 3 copies, or 1 remaining after two prior allocations? | Collector's Edition register | `show_remaining` is off by default; do not display a count | **Yes** |
| May the website show "N copies remaining"? | Storefront availability | off per artwork (`show_remaining = false`) | **Yes** |
| How long is an unpaid reservation held? | Stock | configurable; no live holds until payment exists | **Yes** |
| Which works are `buy` and which are `enquire`? | Storefront | existing storefront modes kept as the starting point | **Yes** |
| Are size and finish surcharges approved prices? | Variant pricing | catalogue prices are prototype figures; do not publish | **Yes** |
| Are the website's 7 existing images licensed for sale as artwork? | Catalogue images | use as placeholders only | **Yes** |
| Is a customer account wanted at launch, or after? | Accounts | guest checkout only | No (can follow launch) |

### DEC-2026-015 — Staff sign-in: Supabase Auth, invitation only, authorised twice
- Date: 2026-11-21
- Context: the Studio Desk needs real staff accounts before it touches the database (docs/04 section 5).
- Proposed choice: email and password through Supabase Auth, with sessions in cookies (never localStorage). Accounts are created by invitation only; public sign-up is switched off in Supabase. After signing in, a person must also hold an active `workspace_memberships` role, checked on the server for every page (`getStaffContext`) in addition to the redirect in `proxy.ts`. Failed sign-ins show one message that does not reveal whether an email has an account. Password reset sends an emailed link and requires at least 12 characters.
- Rollout: sign-in switches on only when `NEXT_PUBLIC_SUPABASE_URL` and the public key are set. Without them the studio stays in demo mode with no sign-in, as before.
- Impact: needs migration 0006 (staff can read their own membership) and the first-owner script (`packages/database/seeds/first_owner.sql`).
- Status: Proposed

### DEC-2026-016 — Open item: multi-factor sign-in
- Context: docs/04 requires MFA for Owner, Admin and Finance before production financial operations.
- Selected choice: not built yet. Supabase supports authenticator-app (TOTP) factors. It must be in place before payments or invoices go live, not before catalogue work.
- Status: Open (launch dependency for finance features)

### DEC-2026-017 — Catalogue is live: saved atomically, images split private and public
- Date: 2026-11-21
- Context: the Catalogue screens now read and write the real database when a staff member is signed in (they still use sample data when sign-in is not configured).
- Proposed choice: a work is saved with one database call (`save_artwork`) so a half-saved work cannot exist; the real status is applied last so the publish guard sees a complete work. The guard now protects scheduled works too, and requires alt text on every image before a work can go live. Scheduled works appear on the website when their date arrives, without a manual step.
- Images: the original goes straight from the browser to the private bucket. A server route then checks the person is an owner or studio manager, makes WebP copies at 800, 1600 and 2400 px (never enlarging, no camera or GPS metadata), and writes them to the public bucket with the service key. That key exists only on the server (`SUPABASE_SERVICE_ROLE_KEY`) and is used for nothing else.
- Limits: 30 MB per image for now, so processing fits a serverless request. Larger print masters need a background worker (open item). Images removed from a work leave their files in storage; a cleanup job is a follow-up.
- Status: Proposed

### DEC-2026-018 — The website reads the catalogue through public views, behind an explicit switch
- Date: 2026-11-21
- Context: the website's works, collections and page pictures were fixed in code. The Studio Desk now holds the real catalogue.
- Proposed choice: the website reads five read-only views (`storefront_artworks`, `_artwork_images`, `_variants`, `_collections`, `_media_slots`) with the public anon key. It never touches CRM tables. The switch is `CATALOGUE_SOURCE=database`; without it the site shows the built-in prototype catalogue exactly as before, so deploying the code changes nothing by itself.
- Behaviour: data is cached and refreshes every five minutes, or at once through `POST /api/revalidate` (shared secret). If the database cannot be read, the error is raised rather than caching an empty shop. Prices come from each work's own sizes and finishes, never from a formula. The bag stores only work, size and finish, and always prices from the live catalogue, so a price changed in the Studio Desk is the price in the bag.
- Empty shop: with no published works the site shows empty collections and an empty shop, not the prototype works.
- Not wired yet: the Studio Desk does not call `/api/revalidate` after publishing (so changes appear within five minutes); the "Menu feature image" slot has no place on the website yet; the checkout is still the walkthrough (no orders reach the database).
- Status: Proposed

> The questions that block real orders are collected, with suggestions and a place for answers, in `docs/17_OWNER_DECISIONS.md`.

### DEC-2026-019 — Website forms are filed in the CRM through server-only functions
- Date: 2026-11-22
- Context: the website's enquiry, contact, commission and newsletter forms showed a success message but sent nothing.
- Proposed choice: each form posts to a route on the website's own server. The route checks the post came from this site, silently drops obvious bots (a hidden trap field and a two-second minimum), then calls a database function with the service key. Two functions (`intake_enquiry`, `intake_newsletter`) can be run by the service role only, check every field again, refuse floods (5 per email, 10 per visitor, 300 overall, per hour) and create or reuse the customer. The visitor's address is stored only as a one-way hash, to refuse floods. The CRM Enquiries screen shows them live, newest first; owners and studio managers can change status.
- Honesty: without `SUPABASE_SERVICE_ROLE_KEY` on the website the forms tell the visitor to email the studio, instead of pretending to succeed.
- Open (docs/17 C3): the privacy notice is not approved, so newsletter consent is recorded with no policy version, and there is no unsubscribe link yet. Do not send marketing email until both exist.
- Not built yet: email notification to the studio when an enquiry arrives; replies from inside the Inbox (the screen offers "Reply by email").
- Status: Proposed

### DEC-2026-020 — Customers screen reads and writes the real database
- Date: 2026-11-22
- Context: the Customers screen showed sample data only.
- Proposed choice: signed-in staff see the real customers (website enquirers, newsletter subscribers, people added by hand) with their enquiries and whether they hold a marketing-email consent. Owners and studio managers can add a customer, edit notes and archive or restore. Nobody can delete: orders and invoices must always point at someone. Migration 0010 adds the missing insert permission for those two roles. Phone numbers are stored in international form (a 10-digit South African number is converted to +27).
- Not built yet: orders and lifetime value (no orders exist), merging duplicate customers, export of a customer's data (docs/17 C3).
- Status: Proposed

### DEC-2026-021 — Bookings are tracked by hand, with no money in them yet
- Date: 2026-11-22
- Context: the Bookings screen showed sample data only. Service packages, prices, deposit rules and cancellation terms are the studio's decisions (docs/17 D5) and have not been made.
- Proposed choice: migration 0011 adds one table of booking requests with the planned pipeline. The owner and studio managers create bookings (blank, or from an open photography enquiry, which is then marked converted) and move them between stages. The shoot type is free text, because the list of services is the studio's to define. Quotes, deposits, invoices and double-booking checks are NOT built. The two payment stages (quoted, awaiting deposit) exist in the database but the screen does not offer them. A photographer sees only bookings assigned to them, and no customer contact details. Bookings are cancelled, never deleted.
- Open: assigning a photographer in the screen, editing a shoot's date after it is created, a calendar view, the confirmation rule (docs/17 D5: does confirming need a deposit?).
- Status: Proposed
