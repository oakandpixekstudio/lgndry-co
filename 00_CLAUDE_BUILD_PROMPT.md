# CLAUDE BUILD PROMPT — LGNDRY.CO STUDIO DESK

> **Copy this entire prompt into Claude after attaching/extracting this handoff folder in the project workspace.** This is a build instruction, not a request for another design concept.
>
> Project: **LGNDRY.Co Studio Desk CRM / Intelligence Center**  
> Product type: internal CRM, fine-art e-commerce operations, photography booking management, invoicing, communications and business intelligence.  
> Primary market/currency: South Africa / ZAR; timezone: Africa/Johannesburg.

You are the lead product engineer and senior UI engineer implementing the **production-capable LGNDRY.Co Studio Desk CRM**. **Build the application. Do not merely generate more documents or redesign it from scratch.** Read all supplied references and specifications before coding. Work incrementally, complete the highest-priority functional path, test what you build, and report what actually works.

## 1. Mandatory source files and precedence

**Read these actual files, in this order:**

1. `references/lgndry-studio-crm-floating.html` — the original interactive CRM HTML prototype I approved. **Reuse its layout structure, interaction patterns, content hierarchy, CSS character and working demonstration behaviours.** Extract reusable React components; do not simply place the HTML in an iframe, ship a monolithic HTML file, or replace it with generic dashboard components.
2. `references/LGNDRY-Intelligence-Center-target.png` — the **latest visual target**. Match its editorial design as closely as practically possible: detached floating near-black sidebar, pale mineral/ivory workspace, oversized 'The Intelligence *Center*.' title, fine dividers, compact KPI strip, sales intelligence, collector signals, photography bookings panel, edition watch, insights and command notes. **Use this image for visual QA.**
3. All Markdown specs in `docs/`, beginning with `01_PRODUCT_REQUIREMENTS.md`; these define functional requirements, including the modules missing from the original HTML.
4. `references/lgndry-editorial-storefront-optional.html` — optional brand/context reference for storefront integration. The CRM is the deliverable, **not** a replacement storefront.

**Conflict rule:** Screenshot controls **visual layout**; original HTML controls **legacy behaviours worth preserving**; specs control **new business behaviour, access rules and acceptance criteria**; security and financial integrity override cosmetic similarity. Record genuine conflicts in `docs/12_DECISIONS_AND_ASSUMPTIONS.md` and choose a safe, documented default. Do not invent unverified business details.

The existing HTML is a **demo using `localStorage` and illustrative records**, with modules Overview, Customers, Orders, Editions, Enquiries, Campaigns, Insights and Settings. It does **not** provide production authentication, persistent backend, real payments, Bookings, Invoices or integrated Inbox. The screenshot is a **visual reference**, not proof those modules already exist. Implement the missing workflows as new features.

## 2. Non-negotiable experience

- Brand: **LGNDRY.Co**, wordmark in uppercase LGNDRY, with `.Co`; do not accidentally rename it LGNRY or Legendary in code.
- A **floating charcoal sidebar** inset from viewport edges; light active navigation highlight; minimal line icons. Desktop order: **Overview, Customers, Orders, Editions, Bookings, Invoices, Enquiries, Inbox, Campaigns, Insights**, then **Settings** in Administration. On mobile use an accessible dismissible navigation drawer.
- Main dashboard title: **The Intelligence Center.** It must be a useful command center with drilldowns, accurate metrics, booking calendar, priority actions and operational signals—not a decorative chart collection.
- **High-end fashion-editorial / art-publication aesthetic**, not generic SaaS cards: monochrome, restrained warm neutrals, oversized bold sans with italic serif contrast, hairlines, strong grid, ample whitespace, squared primary controls and refined responsive behaviour. Never inject random green highlights, gradients or rounded pills. Small semantic status accents are acceptable.
- Meet WCAG 2.2 AA practices. Keyboard and screen-reader operation, visible focus states, chart text alternatives, reduced motion and mobile usability are mandatory.
- Reuse the prototype's useful search, drawers, creation flows, entity detail panels, filters, responsive behaviour and artwork treatment. Replace hard-coded sample metrics with real computed metrics; keep an **explicit Demo Mode** with clearly marked fictional data for local development.

## 3. Functional scope — implement end-to-end

**A. Intelligence Center:** revenue, paid orders, new collectors, booking requests, fulfilment health, repeat-client rate and open enquiries; filter by date and drill into the underlying records. Provide explainable, rule-based alerts for unpaid invoices, high-intent collectors, declining stock, upcoming shoots, open enquiries and fulfilment delays. No fabricated insights or undisclosed AI predictions.

**B. Customers:** deduplicated client/collector records; contact details, purchase/booking history, communication timeline, consent/preferences, segment, notes and assigned owner. A photography client can also be a print collector; do not create duplicate identities.

**C. Orders and Editions:** storefront-submitted print orders; size/frame/edition-run selection; server-side price snapshot; order statuses; edition inventory, reservation expiry, unique numbered edition allocation **only after verified payment**; fulfilment and tracking; cancellations/refunds and audit history. Prevent overselling with database transactions/constraints.

**D. Invoice-first commerce:** On consumer order submission, display a review step, then create an **Order Received / Awaiting Payment** order and issue the appropriate payment-request document. Send a branded acknowledgement and invoice/payment instructions. Provide an **invoice-specific hosted checkout URL** represented both by a clickable `Pay invoice` button and a QR code on the PDF/email. QR must encode a secure URL, not raw banking details or customer data. Only a **verified gateway webhook** (or authorised finance reconciliation of a verified manual EFT with evidence) marks an invoice Paid and releases production/edition allocation. Handle expiry, partial payment (if enabled), refunds, reminders, idempotency and failure states. Do not mark an order paid merely because someone clicked a link or uploaded a screenshot. Confirm tax invoice/pro-forma wording against LGNDRY's actual VAT registration and South African compliance before launch.

**E. Photography Bookings:** website booking enquiries plus internal bookings; service type, location, requested dates/times, crew/resources, quote, client approval, deposit invoice, confirmed shoot, production/editing, final delivery, final-balance invoice. Show a real calendar with availability conflict detection and explicit tentative vs confirmed status. Do not permanently block dates for unconfirmed requests.

**F. Invoices:** invoices linked to orders or bookings; immutable issued snapshots; PDF generation and download; unique invoice sequence; tax and total calculations in integer cents; due date; payment link/QR; send/resend/remind; ledger of payments and outstanding balances. Finance-only issuance, voids and refunds per permission matrix.

**G. Enquiries vs Inbox:** Enquiries are structured requests/cases with status/priority/owner/SLA. Inbox is a unified threaded message workspace linked to a customer/order/booking/enquiry. Initially support verified transactional outbound email; enable provider-backed inbound email only when configured. Drafts and unsent states must not imply actual delivery. No fake email sync.

**H. Campaigns and Insights:** internal campaign drafts, consent-aware audience segments and preview; external send behind configured integration and approval. Accurate reporting with defined formulas, timestamps, comparison periods, privacy-appropriate tracking and filters.

**I. Settings, staff and security:** staff invitation, roles, access control, business details, email and payment integration status, VAT settings, booking services, document numbering, invoice templates, audit logs and demo/production separation.

## 4. Technical approach

Follow `docs/02_TECHNICAL_REQUIREMENTS.md`, `docs/06_DATA_MODEL.md` and `docs/07_API_AND_INTEGRATIONS.md`. Recommended stack: **Next.js App Router + TypeScript + Tailwind CSS (theme derived from prototype), Supabase PostgreSQL/Auth/Storage, and server-side service boundaries**. Use maintained stable versions chosen at installation and commit the lockfile. Separate domain rules, persistence, UI and external adapters. All protected mutations must perform server-side authentication, RBAC, input validation, audit logging and least-privilege database access. Apply RLS and explicit database grants. Never expose service-role secrets or payment credentials to the browser.

External providers may not be configured yet. In that case, build **typed provider interfaces, adapters, secure mock/sandbox flows, disabled production actions and clear integration status**. Do not invent credentials, send customer mail or claim live payments without a real provider configured.

## 5. Repository structure — follow this layout

```text
lgndry-platform/
├── 00_CLAUDE_BUILD_PROMPT.md
├── CLAUDE.md
├── README.md
├── .env.example
├── package.json                   # workspaces / scripts
├── pnpm-workspace.yaml
├── apps/
│   ├── studio/                     # PRIMARY: Next.js LGNDRY CRM
│   │   ├── src/app/
│   │   │   ├── (auth)/login/
│   │   │   ├── (studio)/overview/
│   │   │   ├── (studio)/customers/
│   │   │   ├── (studio)/orders/
│   │   │   ├── (studio)/editions/
│   │   │   ├── (studio)/bookings/
│   │   │   ├── (studio)/invoices/
│   │   │   ├── (studio)/enquiries/
│   │   │   ├── (studio)/inbox/
│   │   │   ├── (studio)/campaigns/
│   │   │   ├── (studio)/insights/
│   │   │   ├── (studio)/settings/
│   │   │   └── api/{public,webhooks,internal}/
│   │   ├── src/components/{layout,editorial,shared}/
│   │   ├── src/features/{intelligence,customers,orders,editions,bookings,invoices,enquiries,inbox,campaigns,insights,settings}/
│   │   ├── src/lib/{auth,data-access,validation,observability}/
│   │   └── public/
│   └── storefront/                 # RESERVED, implement later; do not block CRM
├── packages/
│   ├── domain/                      # shared entities, state machines, rules
│   ├── database/                    # migrations, RLS, seed, typed repositories
│   ├── integrations/                # payments, QR, emails, files, inbound sync
│   └── design-system/               # shared LGNDRY UI primitives/tokens
├── tests/{e2e,integration,security,visual}/
├── docs/                            # all supplied Markdown specifications
└── references/                      # exact supplied HTML and screenshot
```

Create only the folders needed for the initial milestone, but follow the boundaries above. **Never delete or overwrite the reference files**; copy components into the new app and preserve a visual baseline. No customer data or credentials in git.

## 6. Development and proof of completion

Work in this order:

1. Inspect the HTML's real modules, state, styles and interactions; create a concise mapping of old elements to new React components; compare the screenshot and list visual/feature deltas.
2. Scaffold the repository and ensure install, typecheck, lint and dev server work.
3. Rebuild the **floating-sidebar shell and Intelligence Center screen first** to closely match the screenshot at 1672×941 and typical 1440px desktop, then mobile 390px. Capture real browser screenshots and fix layout regressions. Do not produce just an image of the design: build the interface.
4. Implement auth/RBAC, schema/migrations, access policies, fixtures and reliable data services.
5. Deliver customers, editions, orders, invoice-first flow, invoice PDF + QR/payment adapter, bookings, enquiries/inbox, campaigns, insights and admin in the dependency order from `docs/11_IMPLEMENTATION_ROADMAP.md`.
6. Wire overview cards to real operational queries and rule-based insights, with drilldowns and transparent date filters.
7. Run unit, integration, e2e, RLS/authorization, webhook-idempotency, concurrency and visual-regression tests. Do not treat screenshots or seeded data as proof of payment/email functionality.
8. Keep `docs/12_DECISIONS_AND_ASSUMPTIONS.md` up to date. At completion, provide: changed files, routes/screens delivered, migration instructions, env variables, commands run, test outcomes, screenshots, configuration still needed for real payment/email, and known gaps.

**Definition of done:** The delivered application visually tracks the screenshot, preserves useful HTML prototype interactions, supports the specified workflows with real server-backed states and guarded integrations, makes misleading demo/live claims impossible, and passes the acceptance tests in `docs/10_QA_AND_ACCEPTANCE.md`.

**Start now by reading the references, extracting the existing HTML architecture, and implementing the first working milestone.** Do not ask broad planning questions when the supplied documents establish a safe default; log genuinely unresolved business/provider decisions and leave unsupported live functionality disabled.
