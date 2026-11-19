# 10 — Quality Assurance, UAT and Acceptance Tests

**Goal:** provide executable acceptance criteria so “the page looks like the screenshot” is necessary but not sufficient.  
**Gate:** no production go-live with a known critical security, payment-integrity or edition-allocation defect.

## 1. Test levels

| Test level | Target | Tooling / proof |
|---|---|---|
| Static quality | TypeScript strict, formatting, lint, secrets/dependency checks | CI output and clean lockfile |
| Unit | domain transitions, cents/tax math, KPI calculations, consent rules | Vitest (or equivalent) |
| DB integration | transactions, unique constraints, RLS/grants, race conditions | isolated PostgreSQL/Supabase test DB |
| API integration | validation, auth, idempotency, provider errors and webhooks | HTTP tests with mock sandbox providers |
| Browser e2e | end-to-end order/booking/invoice/staff flows | Playwright |
| Visual regression | screenshot parity and responsiveness | baseline browser screenshots vs supplied target |
| Accessibility | screen readers/keyboard, focus, contrast, labels, reflow | axe + manual checks |
| Security | broken access, signature failure, replay, XSS, CSRF, rate limits | negative and penetration-oriented tests |
| UAT | actual studio tasks by role using staging data | signed checklist |

## 2. Must-pass user journeys

### UAT-01 — Desktop visual parity

**Given** app at 1672×941, **when** logged in as Owner in staging, **then** dashboard has floating sidebar and all 11 navigation entries, headline `The Intelligence Center.`, KPI rail, revenue chart, collector signals, photography bookings calendar/next shoots, edition watch, featured artworks, insights and key takeaways with similar proportions, type contrast and spacing to target screenshot. Differences must be documented and reviewed; pixel-perfect match is a goal but not allowed to override readability/accessibility.

### UAT-02 — Mobile and keyboard

At 390px: no full-page horizontal overflow; sidebar uses drawer, can be opened/closed by button/Escape, focus does not escape while open, menu and primary forms are reachable, active page is clear. Test 200% browser zoom and reduced motion.

### UAT-03 — Collector created and found

Collector Relations creates a customer; record exists in database after reload; email is normalized; duplicate email triggers safe merge or explicit duplication warning; profile timeline and global search show the same record; a Photographer without assignment cannot retrieve it via URL/API.

### UAT-04 — Customer places invoice-first art order

Guest chooses an available edition variant, edits address during review, accepts terms and submits; server computes price; one order exists with `AWAITING_PAYMENT`, one invoice document/record and one pending notification; customer sees order ref and accurate pending-payment wording. Repeated submit with same idempotency key does not create a second order.

### UAT-05 — QR and Pay Invoice link

Issued invoice PDF contains a scannable QR code, accurate serial/amount and payment terms. QR and clickable Pay Invoice button resolve to same active invoice-specific secure provider session. QR does not expose customer PII. Token expiration/void handling gives safe message; payment page does not allow customer to change trusted invoice amount.

### UAT-06 — Verified payment allocates one edition

Valid signed sandbox webhook marks payment settled, invoice Paid and order Payment Confirmed; edition number allocated uniquely and confirmation queued. Resending webhook 10 times leaves exactly one payment ledger event and one edition allocation. Clicking “payment successful” frontend callback without verified webhook leaves order awaiting payment.

### UAT-07 — Concurrency and edition stock

Two customers attempt last available copy simultaneously; at most one active hold/payment allocation may consume final capacity (per configured hold model). The other gets sold-out/waitlist response. On expired hold, availability is released. A late payment for an expired/sold-out edition creates an exception requiring Finance, never oversells.

### UAT-08 — Invoice cannot be tampered with

Finance issues PDF and invoice serial; original issued snapshot remains unchanged. Collector Relations cannot alter totals, mark Paid or refund. Authorized void/refund requires reason, event and preserved ledger/document history. Invoice balances reconcile to cents.

### UAT-09 — Booking request and deposit

Customer submits a photography request; sees **request received**. Studio Manager sends quote; customer approval recorded; deposit invoice sent with QR and link; signed verified deposit triggers booking confirmation only if slot/resources available; session then appears in calendar. Before deposit, calendar shows tentative status, not confirmed.

### UAT-10 — Booking conflict

Two staff members attempt to confirm the same photographer at overlapping times; only one succeeds. Second gets `BOOKING_CONFLICT` and suggested replan; no duplicate confirmed assignment in DB.

### UAT-11 — Enquiry vs Inbox

Inbound enquiry creates/links structured case and thread. Assigned staff drafts reply (status Draft); only a configured provider submission changes status Queued/Sent; failed send is visible and retryable. Enquiry resolution does not delete thread. Without inbound integration, UI says “Inbound sync not connected.”

### UAT-12 — Role restrictions

Test role matrix: Photographer sees assigned shoot only; Fulfilment sees paid orders' shipping info only; Analyst aggregate only; Admin cannot self-elevate; Finance alone can issue invoices; all UI and direct API requests enforce the same rule. Disabled users lose active access.

### UAT-13 — Dashboard accuracy

Load small known fixture dataset (e.g. 3 paid orders, 1 refund, 2 booking deposits, 1 unpaid invoice, 1 open enquiry). Verify KPI formulas with cents/tax and drilldowns. No sample demo amount appears in production; dashboard “last updated” reflects source freshness. Test empty and zero-denominator states.

### UAT-14 — Accessibility

All interactive elements have labels; icon-only buttons have accessible names; focus states visible; high-level headings semantic; charts include data table; no essential information depends on color only; error summary announced; dialog focus returns to trigger on close.

### UAT-15 — No false integrations

With payment and email environment variables missing, the CRM displays `Not connected` and disables live send/pay actions without calling external services. It must not claim a sent acknowledgement or paid invoice and must not expose a misleading “live” indicator.

## 3. Financial and booking negative cases

| Test | Expected behavior |
|---|---|
| Client sends `totalCents: 1` with costly artwork | ignored/rejected; server recomputes |
| Duplicate booking form submit | one booking by idempotency key |
| Fake webhook signature | error; zero ledger/allocation change |
| Same provider event repeated | exactly once effect |
| Webhook for mismatched invoice/currency/amount | quarantined; finance alert |
| Expired hosted session clicked | no invalid charge; refreshed safe flow if possible |
| Partially paid print invoice | not eligible for production under default full-pay rule |
| Paid invoice refund | refund recorded; original invoice remains historical |
| Invoice PDF sending fails | visible failed outbox item; no false Sent |
| Limited-edition count changed after copies sold | privileged review/audit; cannot set below allocated count |
| Booking deposit paid but slot taken | exception, no false confirmed booking, finance resolution |
| Marketing opt-out | suppressed from marketing, still receives lawful transactional order updates |
| Two roles update same order | validated state transition and concurrency control |
| Upload malicious attachment | rejected/quarantined and never rendered as trusted HTML |

## 4. Visual QA matrices

| Screen | 1672x941 desktop | 1440x900 | 1280x800 | 768x1024 | 390x844 |
|---|---|---|---|---|---|
| Intelligence Center | required | required | required | required | required |
| Floating sidebar nav | required | required | required | drawer | drawer |
| Customers list + profile | required | required | required | required | required |
| Orders list + details | required | required | required | required | required |
| Edition catalogue | required | required | required | required | required |
| Bookings calendar + form | required | required | required | required | required |
| Invoices list/detail/QR | required | required | required | required | required |
| Inbox threads | required | required | required | required | required |
| Settings / staff controls | required | required | required | required | required |

**Visual baseline artifact:** `references/LGNDRY-Intelligence-Center-target.png`; compare title sizing, sidebar inset, card layout, header, spacing, palette. Test full screen capture and relevant viewport crops. Use real browser screenshots, not generated images presented as implementation evidence.

## 5. Definition of done per feature

1. Working UI in correct route, with empty/loading/error and responsive states.
2. Real authorized server read/write with validation and consistent data after refresh.
3. Business state transitions implemented and audited.
4. Permission negative tests pass; RLS/grants added where relevant.
5. Critical flows unit/integration/e2e tested and documented.
6. No false “paid/sent/confirmed” claims; environment provider readiness disclosed.
7. Acceptance screenshots and test reports saved and linked in completion notes.

## 6. UAT sign-off sheet

| Area | Accountable reviewer | Sign-off evidence |
|---|---|---|
| Visual brand fidelity | Owner / Brand lead | screenshot comparisons and accessibility notes |
| Order/edition integrity | Studio Manager + Finance | live-like sandbox transaction evidence |
| Invoice and QR flow | Finance | PDF approval, gateway sandbox verification |
| Booking workflow | Studio Manager / Photographer | conflict tests and real scenario walkthrough |
| Security/privacy | Technical lead / owner | RLS report, RBAC matrix, incident/retention checklist |
| Customer communication | Owner / Client Relations | email preview and deliverability tests |
| Production release | Owner + Technical lead | signed go/no-go with known gaps and rollback plan |
