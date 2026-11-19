# 01 — Product Requirements Document (PRD)

**Product:** LGNDRY.Co Studio Desk  
**Primary screen:** The Intelligence Center  
**Release designation:** v1 implementation specification  
**Region:** South Africa (`en-ZA`, `ZAR`, `Africa/Johannesburg`)  
**Status:** Proposed build requirements; not a claim that the prototype already supports them  
**Design reference:** `../references/LGNDRY-Intelligence-Center-target.png`  
**Behaviour reference:** `../references/lgndry-studio-crm-floating.html`

## 1. Product thesis

LGNDRY.Co has two complementary businesses: (1) a curated, potentially limited-edition fine-art print catalogue, and (2) photography services delivered through booked shoots. Studio Desk is the single operational system connecting website enquiries, customers, orders, numbered editions, invoices, payments, production, fulfilment, photography bookings, correspondence and measurable performance. Its visual language is deliberately editorial. Its workflows must be unmistakably practical.

**Core principle:** one customer, one record of truth, many related activities. Studio staff should never reconcile disconnected spreadsheets or guess whether an order is actually paid or a shoot actually confirmed.

## 2. Outcomes and product success

| Outcome | Observable success criterion | Initial target/guardrail |
|---|---|---|
| A coherent operating system | Each order or booking is linked to a customer and its invoices/messages/activity | 100% of new transactions linked |
| Faster payment collection | Invoice QR and button open the same invoice-specific, securely hosted payment session | All payable invoices have valid link and QR |
| Prevent oversold editions | Paid edition allocation is transactional and numbers are unique | 0 duplicate edition numbers / oversells |
| Reliable bookings | Double-booking prevention for confirmed resources/times | 0 system-approved resource conflicts |
| Actionable intelligence | Every headline metric is calculated and drillable | 100% KPI definitions documented |
| Secure staff operations | Rights enforced on server and database; material events audited | 0 known critical auth/RLS findings at launch |
| Premium user experience | Editorial UI similar to target at desktop/mobile; accessible | Visual QA + WCAG 2.2 AA test coverage |

Conversion and repeat-purchase benchmarks must be baselined from real activity, not assumed. Demo figures in the screenshot are illustrative only.

## 3. Users and jobs-to-be-done

| Persona | Primary job | Primary screens |
|---|---|---|
| Owner / Director | Understand performance, exceptions, cash position and upcoming production | Intelligence Center, Insights, Settings |
| Studio Manager | Coordinate shoot pipeline, clients, calendar and fulfilment | Bookings, Orders, Inbox, Enquiries |
| Finance | Issue compliant invoices, reconcile payment, manage overdue accounts, refunds | Invoices, Orders, Booking financials |
| Client / Collector Relations | Respond to customers and convert print/booking interest | Customers, Enquiries, Inbox, Orders |
| Photographer / Creative Team | Access assigned shoot brief, schedule and required client details | Bookings, limited customer view |
| Production / Fulfilment | Prepare paid prints, reserve edition certificates and dispatch | Editions, Orders |
| Read-only Analyst | Inspect approved business metrics without modifying records | Overview, Insights |
| Website customer | Submit an art order or booking request; receive clear next steps | Public storefront, email, hosted payment |

## 4. What v1 includes

**P0: must work for the initial operational release**

- Authentication, staff roles, permission enforcement, activity audit, real database and production/demo separation.
- Floating-sidebar app shell matching the screenshot, responsive navigation, global search, entity detail views and clear error/empty/loading states.
- Customer identity and activity; Editions and limited-edition inventory with no oversells.
- Order submission via a secure public/storefront integration and order management in CRM.
- Invoice-first purchasing: acknowledgement, PDF/payment request, invoice-specific QR and link, verified payment reconciliation, order progress and basic reminders.
- Photography bookings: request intake, quote, deposit payment, confirmation, calendar, progress, final balance.
- Invoices module and structured Enquiries. Basic Inbox thread view, transactional outgoing messages and linked history; full inbound sync may be gated as P1 when provider is unknown.
- Intelligence Center with computed revenue/volume/alerts and links to underlying transactions.
- Production-safe configuration and observable errors; unit/e2e/security tests.

**P1: deliberate enhancements after P0 is stable**

- Gmail or Microsoft 365 two-way Inbox sync, attachments and assisted routing.
- Automated campaign sending, approval, frequency caps and suppression logic.
- Advanced booking crew planning, travel/locations, equipment booking and resource utilisation.
- Advanced collector engagement scoring with opt-in tracking, deep cohort analytics.
- Client proofing/selection portal and digital asset hand-off for photography sessions.
- Tax/accounting export or integration and formal credit notes based on finance requirements.

**Excluded from v1:** a public marketplace, subscription billing, multi-company SaaS product, automatically generated AI marketing messages, biometric recognition, and an unsupported promise of real-time banking reconciliation without an approved payment provider.

## 5. Module specifications

### PRD-INT — Intelligence Center (Overview)

**Layout:** oversized “The Intelligence *Center*.” headline, small editorial image strip, seven KPI cells, multi-panel analytics, booking/calendar preview, edition/fulfilment alerts, featured works and command notes as pictured.

- `INT-01` Date-range filters with comparison period, data freshness indicator, currency/unit context and drilldowns; no hard-coded November 2026 figures outside demo fixtures.
- `INT-02` Revenue KPI counts settled sales according to `08_ANALYTICS_AND_KPIS.md`; clearly distinguish gross sales from invoiced but unpaid amount.
- `INT-03` Paid orders/new collectors/booking requests/fulfilment health/repeat-client rate/open enquiries are derived from underlying records and documented denominators.
- `INT-04` “Collector signals” show explainable rules and source events: interest views, repeat opportunities and collection trends. No hidden black-box assertions.
- `INT-05` Booking calendar previews upcoming **confirmed** shoots and distinguishes requests from accepted work.
- `INT-06` Action list surfaces outstanding invoices, pending quote approvals, unresponded enquiries, critical edition stock and fulfilment delays.
- `INT-07` Every alert goes to the relevant filtered records; alerts can be marked read but cannot erase financial or operational facts.

**Acceptance:** a drill-down resolves to the same filtered entities that generated the metric, and data changes flow back into the dashboard within an agreed freshness window (target <= 60 seconds after a confirmed mutation).

### PRD-CUS — Customers

- `CUS-01` Create/view/update customer with individual/business name, email, phone, billing and delivery addresses, geographic context, notes, source and owner.
- `CUS-02` Unique identity/deduplication for email (case-insensitive) within workspace; merge workflow is audited and preserves historical linked records.
- `CUS-03` Single profile timeline for orders, bookings, payments, enquiries and communications.
- `CUS-04` Segment customers: first-time, repeat, VIP, high-intent, lapsed — rule-based or explicitly manually assigned.
- `CUS-05` Consent records for transactional vs optional marketing contact; marketing opt-out honored everywhere.
- `CUS-06` Export/erasure requests route to an authorized privacy workflow, subject to lawful records retention.

### PRD-ORD — Orders

- `ORD-01` Server-authenticated admin-created order and rate-limited public submitted order.
- `ORD-02` Review-before-submit displays selected artwork, edition/variant, print size, frame, quantity, delivery, taxes, total, terms and cancellation/returns information.
- `ORD-03` On submit, create unique order reference with status `AWAITING_PAYMENT`, price/tax/delivery snapshot, customer link, provisional stock reservation with configurable expiry, audit event and idempotent acknowledgement dispatch.
- `ORD-04` Automatically generate a payable invoice/payment-request document and QR/link if merchant settings/payment provider are configured; otherwise show explicit `PAYMENT_SETUP_REQUIRED` operational exception and use approved manual process.
- `ORD-05` Verified payment progresses the order, allocates edition number uniquely, and triggers production tasks. **Submission is not payment and cannot allocate a number permanently.**
- `ORD-06` Production -> ready to dispatch -> shipped -> delivered, each with timestamps, operator and optional tracking evidence.
- `ORD-07` Cancellations and refunds require permitted roles, reason and refund reconciliation. Never silently erase financial transactions.
- `ORD-08` Support retry/resume links without creating duplicate orders; idempotency protection for customer double clicks.

### PRD-EDT — Artworks and numbered editions

- `EDT-01` Artwork has title, visual assets, narrative, SKU, collection, release status and archival details; price is per sellable variant.
- `EDT-02` Edition runs define finite total copies and possible variant associations. Expose available/reserved/sold counts accurately.
- `EDT-03` Paid allocation assigns a never-reused unique number within its run in a transaction, with certificate of authenticity (COA) reference.
- `EDT-04` Temporarily reserve capacity while invoice is active, with automatic expiry/release and explicit waitlist/sold-out handling.
- `EDT-05` Flag low availability (configurable threshold), inconsistent editions or unfulfilled paid prints.
- `EDT-06` Editing edition total or run after sales requires privileged approval and an audit trail.

### PRD-BKG — Photography bookings

- `BKG-01` Customer requests service type, date/time options, location, brief, contact details and budget range (optional); acknowledgement is **request received**, not confirmed booking.
- `BKG-02` CRM booking pipeline: `REQUESTED` -> `REVIEW` -> `QUOTED` -> `AWAITING_DEPOSIT` -> `CONFIRMED` -> `SCHEDULED` -> `IN_PROGRESS` -> `EDITING` -> `DELIVERED` -> `COMPLETED`, plus cancellation/expiry branches.
- `BKG-03` Staff create quotation with scoped deliverables, exclusions, deposit percentage, total and expiry; customer approval captured as event.
- `BKG-04` Send deposit invoice with QR/online link; verify deposit and confirm only after approval and resource availability.
- `BKG-05` Calendar supports month/week views, location/timezone, assigned personnel, resource conflicts, tentative holds with expiry, and confirmed shoot badges.
- `BKG-06` Internal shoot record stores schedule, creative brief, shot list, logistics, assigned photographer(s), links and completion/delivery timestamps.
- `BKG-07` Final-balance invoice and delivery workflow; payments linked to same booking/customer.

### PRD-INV — Invoices and payments

- `INV-01` Invoice has unique serial, issue date, due date, issuer details, recipient, line items, taxes and totals; distinct issue and payment statuses.
- `INV-02` Immutable issued snapshot, versioned PDF, authorized void/credit/refund operation instead of destructive edits.
- `INV-03` Individual QR + `Pay invoice` URL direct to secure hosted checkout with amount and reference set server-side; QR not just banking details.
- `INV-04` Show status, payment attempts, ledger entries, partials where allowed, payment confirmation, reminders, overdue and full invoice history.
- `INV-05` Deposit + balance invoices for bookings; single-payment full invoice for prints by default.
- `INV-06` Finance-reviewed VAT handling; never assume LGNDRY is VAT registered. Invoice wording must be configurable and approved before production.

### PRD-ENQ / INB — Enquiries and Inbox

- `ENQ-01` Enquiry record has category, status, priority, assignee, source, linked customer, linked order/booking, timestamps and resolution.
- `ENQ-02` Convert request into order/booking or link to existing item; avoid duplicate creation.
- `INB-01` Unified conversation timeline shows outbound acknowledgements, invoice messages, booking responses and inbound email if connected.
- `INB-02` Inbox statuses: unread, needs reply, snoozed, resolved; send, draft, assign and audit.
- `INB-03` Outbound may be transactional under approved email provider. Inbound and two-way sync must display clearly when not configured.
- `INB-04` No message may be shown as `Sent` until provider accepted delivery request. Track `Queued`, `Sent`, `Failed` and bounce status where available.

### PRD-CMP / INS — Campaigns and Insights

- `CMP-01` Audience selections follow marketing consent; build drafts with previews and approval workflow.
- `CMP-02` Initial release may save internal drafts only. Never expose a working Send action without a configured email provider and authorization.
- `INS-01` Data dictionary, revenue/cash/booking/order funnels, overdue invoices, edition velocity, enquiry response times and retention cohorts.
- `INS-02` Explainability: signal name, source records, calculation window, last refreshed and human-readable rationale.
- `INS-03` Exports authorized and audited; exclude protected customer data when role lacks permission.

### PRD-ADM — Administration

- `ADM-01` Staff invitations, active/inactive status, assigned roles, session revocation and permissions.
- `ADM-02` Business legal identity, addresses, branding, approved document templates, contact details, currency, timezone, tax/VAT configuration.
- `ADM-03` Payment, email, storage and storefront integration status with actionable configuration checks.
- `ADM-04` Audit log, API errors, reconciliation exceptions, event retry tooling (restricted roles).
- `ADM-05` Staff must never access production functionality just because a button is visible.

## 6. Core commercial journeys

**Fine-art print:** browse -> choose variant -> review order -> submit -> receive order acknowledgement and invoice -> QR/link payment -> verified payment -> edition allocation -> production -> dispatch -> delivered.

**Photography:** service enquiry -> studio review -> quote -> approval -> deposit invoice -> verified deposit -> calendar confirmation -> shoot -> edit -> delivery -> final balance/closeout.

**Relationship management:** first contact -> deduplicated customer -> enquiries/inbox threads -> transaction history -> follow-up -> repeat business.

## 7. Important product constraints

- A customer-facing order confirmation must not falsely say the artwork is paid, accepted for production or allocated while awaiting payment.
- A booking request is not a confirmed calendar commitment.
- No automated actions on customer money, refunds or marketing sends without explicit configured permissions and provider confirmation.
- Website and CRM must share authoritative transaction records through secured APIs; do not maintain two competing inventory balances.
- Do not mix demo KPI totals with production data. Use badges, environments and separate seeded fixtures.

## 8. Open decisions before public launch

Merchant VAT status/registration; exact legal business name and invoicing address; selected SA payment provider and whether hosted payment links support QR flow; email/inbox provider; invoice validity window and reservation expiry; shipping services and fee model; refund/return policy; photo service packages, deposit policies and calendar-resource rules; artwork variant/edition numbering rules; whether customer accounts are required (recommend guest ordering initially). These do **not** block the UI and internal domain build; keep affected production actions gated.

## 9. Handoff links

- Workflow/state diagrams: `03_APPLICATION_WORKFLOWS.md`
- Permission design: `04_SECURITY_AND_ACCESS.md`
- Schemas: `06_DATA_MODEL.md`
- KPI math: `08_ANALYTICS_AND_KPIS.md`
- Tests: `10_QA_AND_ACCEPTANCE.md`
