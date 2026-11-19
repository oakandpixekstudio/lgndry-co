# LGNDRY.Co platform

Monorepo for the LGNDRY.Co **Studio Desk** CRM (`apps/studio`) and its shared packages. The public
storefront (`apps/storefront`) is a separate repository, deployed on Vercel from GitHub.

> **Status: Phase 1 in progress.** The floating-sidebar shell and the Intelligence Center screen are
> built and run on clearly marked **demo data**. There is no database, authentication or payment
> integration yet. See "What works today" below.

## Run it

Requirements: Node 22+ and pnpm 10.

```bash
pnpm install
pnpm dev            # Studio Desk on http://localhost:3100
pnpm typecheck
pnpm lint
pnpm build
```

Copy `.env.example` to `apps/studio/.env.local` if you need to change settings. `DEMO_MODE` defaults to
on, so the app shows fictional figures (and says so) until a real database is connected.

## What works today

| Area | State |
|---|---|
| Floating charcoal sidebar, topbar, mobile drawer (focus management, Escape, scroll lock) | Built |
| Intelligence Center (`/overview`): hero, 7 KPI cells, sales chart with accessible table, collector signals, bookings calendar, edition watch, insights, command notes | Built, **demo data only** |
| Global search (Ctrl/Cmd+K) | Searches workspace sections only; record search needs the database |
| Customers, Orders, Editions, Bookings, Invoices, Enquiries, Inbox, Campaigns, Insights, Settings | Real routes with an honest "not built yet" page stating the phase that delivers them |
| Authentication, roles, database, invoices, QR payments, webhooks, email | **Not built** (Phases 2 to 6) |

Nothing on screen claims a payment was taken or an email sent. Demo figures are labelled "Demo".

## Layout

```
apps/studio        Next.js CRM (implement now)
apps/storefront    separate repo (Vercel); reserved. NOTE: still at webites/lgndry-store until its dev server is stopped and the folder is moved
packages/          domain, database, integrations, design-system (empty until their phases)
tests/             unit, integration, e2e, security, visual (not written yet)
docs/              product, technical, security, data and workflow specifications
references/        approved HTML prototype and visual target (never edit)
```

Build order and gates are in `docs/11_IMPLEMENTATION_ROADMAP.md`. Engineering decisions and open
business questions are in `docs/12_DECISIONS_AND_ASSUMPTIONS.md`. The mapping from the original HTML
to React components is in `docs/16_PHASE0_SOURCE_AUDIT.md`.
