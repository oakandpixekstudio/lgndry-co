# 03 — Application Workflow and State Specification

**Purpose:** define what users see, which entity changes, which event is emitted, what fails safely, and which views update. The screenshot specifies the intended UI; these flows specify functional behaviour.

## 1. Navigation and screen structure

```mermaid
flowchart TD
  Login[Staff login + optional MFA] --> Shell[Floating sidebar / Studio shell]
  Shell --> Overview[Overview / Intelligence Center]
  Shell --> Customers[Customers]
  Shell --> Orders[Orders]
  Shell --> Editions[Editions]
  Shell --> Bookings[Bookings + Calendar]
  Shell --> Invoices[Invoices + Payments]
  Shell --> Enquiries[Enquiries / Cases]
  Shell --> Inbox[Inbox / Threads]
  Shell --> Campaigns[Campaigns]
  Shell --> Insights[Insights]
  Shell --> Settings[Settings / Staff / Integrations]
  Overview --> Orders
  Overview --> Bookings
  Overview --> Invoices
  Overview --> Enquiries
  Orders --> Customers
  Orders --> Editions
  Orders --> Invoices
  Bookings --> Customers
  Bookings --> Invoices
  Inbox --> Enquiries
```

**Global command search:** Ctrl/Cmd+K opens a query dialog -> authorized results across customers/orders/artworks/bookings/invoices/enquiries/threads -> select -> record detail drawer or full-page view -> preserve back navigation. No unauthorized results should be surfaced.

**Mobile navigation:** menu -> focus trapped overlay -> choose page -> close and restore focus; Escape/backdrop closes. All tables provide responsive summary rows and details.

## 2. Art order: website to production

```mermaid
sequenceDiagram
  participant C as Customer
  participant W as Storefront
  participant S as Studio API
  participant D as Database
  participant Q as Job/Email queue
  participant P as Payment gateway
  participant F as Fulfilment
  C->>W: Select artwork, edition, size/frame, delivery
  W-->>C: Review complete order + terms
  C->>W: Place Order (idempotency token)
  W->>S: POST order with selections (not trusted prices)
  S->>D: Validate prices, reserve stock, create order+invoice+events
  D-->>S: Committed order ID / payment status
  S->>Q: Queue acknowledgement, PDF invoice, secure URL + QR
  S-->>C: Order received / awaiting payment
  Q-->>C: Branded order acknowledgement + invoice
  C->>P: Scan QR or click Pay invoice
  P-->>S: Signed server-to-server payment event
  S->>P: Verify merchant/amount/currency/status as needed
  S->>D: Idempotent payment ledger + invoice paid + edition allocation
  S->>Q: Queue paid receipt and production notification
  Q-->>C: Payment confirmed / next steps
  F->>D: Production -> dispatch -> delivered with evidence
  Q-->>C: Status and dispatch notifications
```

**Order rules:**

1. Accept guest ordering; use verified contact email as identifier, not a mandatory storefront password.
2. Customer reviews entire transaction, corrections and terms before submission.
3. Create order with `AWAITING_PAYMENT`. Do not use wording implying paid/confirmed production.
4. Temporary stock hold is configurable (proposed default 72h; requires business approval). On expiry, release hold and offer a new order/payment session if still available.
5. The PDF and QR must reference the same approved invoice/payment session; the QR is not a raw static bank-detail payload.
6. The payment provider acknowledgement in the browser is **not** a trusted payment event. Only validated webhook or finance-controlled reconciliation can mark paid.
7. Payment and edition allocation share a transaction and unique constraints; duplicate events change nothing.
8. If gateway payment arrives after reservation expiry/sell-out, flag `PAYMENT_EXCEPTION`, safeguard money, stop allocation, and request finance resolution/refund; do not fabricate availability.
9. A failed notification does not roll back a valid order/payment; it enters outbox retry with visible operational alert.
10. Partial payment (if allowed by Finance) leaves invoice partly paid and order unapproved for production unless a policy specifically permits a deposit.

### Order state machine

```mermaid
stateDiagram-v2
  [*] --> AWAITING_PAYMENT: order submitted
  AWAITING_PAYMENT --> PAYMENT_REVIEW: manual EFT evidence submitted
  PAYMENT_REVIEW --> AWAITING_PAYMENT: evidence rejected
  AWAITING_PAYMENT --> PAYMENT_CONFIRMED: verified full payment
  PAYMENT_REVIEW --> PAYMENT_CONFIRMED: finance verified bank receipt
  AWAITING_PAYMENT --> EXPIRED: hold expired and unpaid
  AWAITING_PAYMENT --> CANCELLED: customer/staff cancellation
  PAYMENT_CONFIRMED --> IN_PRODUCTION: allocation + work queued
  IN_PRODUCTION --> READY_TO_DISPATCH
  READY_TO_DISPATCH --> SHIPPED
  SHIPPED --> DELIVERED
  PAYMENT_CONFIRMED --> REFUND_REVIEW
  IN_PRODUCTION --> REFUND_REVIEW
  REFUND_REVIEW --> REFUNDED: approved reconciled refund
  EXPIRED --> [*]
  CANCELLED --> [*]
  DELIVERED --> [*]
  REFUNDED --> [*]
```

**Note:** Statuses above are logical state labels; a payment, invoice, order and fulfilment have distinct state columns and historical transitions. An order can be `DELIVERED` while invoice has a separate (e.g. corrected) financial record.

## 3. Invoice/payment workflow

```mermaid
flowchart TD
  Source[Order or Booking] --> Snapshot[Generate invoice lines and tax snapshot]
  Snapshot --> Review[Review and authorization]
  Review --> Issue[Issue immutable serial + PDF]
  Issue --> Checkout[Create hosted payment session]
  Checkout --> Code[Embed secure session URL as QR + email link]
  Code --> Email[Send transactional email]
  Email --> Pending[ISSUED / AWAITING PAYMENT]
  Pending -->|Verified webhook| Reconcile[Record payment ledger]
  Pending -->|Due date passed| Overdue[OVERDUE + reminder policy]
  Pending -->|Approved void| Void[VOID with reason + audit]
  Reconcile -->|Full amount| Paid[PAID -> downstream domain action]
  Reconcile -->|Partial, permitted| Partially[PARTIALLY_PAID -> balance due]
  Paid --> Refund[Authorized refund/credit flow]
  Overdue -->|Late payment| Reconcile
```

**Invoice PDF content:** correct legal issuer, recipient, invoice/reference number, issue/due dates, description, quantity, price, net/tax/total (depending on tax configuration), amount paid/balance, secure QR, Pay Invoice link, terms and contact. Do not label a document `Tax Invoice` unless authorized by the VAT/business configuration. Document issue and later amendments use immutable snapshots and a credit/void approach.

**Invoice UX:** searchable table with number, customer, source (order/booking), total, balance, status, due date and actions; detail drawer shows PDF preview, payment history, QR, send status, internal notes and audit timeline. `Resend`, `Void`, `Refund`, `Mark Paid` buttons are role-/integration-gated.

## 4. Photography booking workflow

```mermaid
sequenceDiagram
  participant C as Client
  participant S as Studio booking API
  participant M as Studio manager
  participant D as Calendar/resource database
  participant I as Invoicing
  C->>S: Request service / preferred dates / brief
  S-->>C: Request received (not confirmed)
  S->>M: Create REQUESTED task and alert
  M->>D: Check availability, logistics and crew
  M-->>C: Send quote + scope + optional proposed slot
  C-->>M: Accept quote
  M->>I: Issue deposit invoice with payment link + QR
  C->>I: Pay deposit via hosted checkout
  I-->>D: Verified deposit event
  D-->>M: Confirm resource slot atomically
  M-->>C: Confirmed shoot + schedule and preparation brief
  M->>D: Shoot -> post-production -> delivery records
  M->>I: Issue final balance invoice (if applicable)
  I-->>C: Final payment confirmation/receipt
```

### Booking state machine

```mermaid
stateDiagram-v2
  [*] --> REQUESTED
  REQUESTED --> IN_REVIEW
  IN_REVIEW --> QUOTED
  QUOTED --> QUOTE_DECLINED
  QUOTED --> AWAITING_DEPOSIT: quote accepted
  AWAITING_DEPOSIT --> CONFIRMED: deposit verified + slot available
  AWAITING_DEPOSIT --> EXPIRED: quote/deposit hold expired
  CONFIRMED --> SCHEDULED
  SCHEDULED --> IN_PROGRESS
  IN_PROGRESS --> EDITING
  EDITING --> DELIVERED
  DELIVERED --> COMPLETED
  REQUESTED --> CANCELLED
  IN_REVIEW --> CANCELLED
  CONFIRMED --> CANCELLED: authorized cancellation policy
  QUOTE_DECLINED --> [*]
  EXPIRED --> [*]
  COMPLETED --> [*]
  CANCELLED --> [*]
```

**Important conflict case:** if the desired time becomes unavailable before deposit verification, record a scheduling exception and initiate a new slot offer. Taking a deposit without a viable slot must not result in a silent confirmation.

**Booking calendar:** staff can view month/week/day; statuses have visible text and distinct treatment, not color only. Assign crew and equipment only to supported availability models. Lock confirmed resource time ranges transactionally. Show time zone next to schedule. Calendar cards link to booking record with customer, shoot brief, quotation, deposit and communications.

## 5. Enquiries and Inbox — separate responsibilities

```mermaid
flowchart LR
  Source[Website form / Email / Staff entry] --> Match[Find or create customer]
  Match --> Thread[Inbox thread + messages]
  Thread --> Case[Linked enquiry / case when action needed]
  Case --> Assign[Assignee, priority, due/SLA]
  Assign --> Work[Reply, book, quote, issue invoice, follow-up]
  Work --> Resolve[Resolved / converted / closed]
  Resolve --> Timeline[Customer activity timeline]
```

- **Inbox** holds individual messages, participants, delivery state, attachments and thread membership. A thread can link to an enquiry, order, booking or invoice.
- **Enquiries** hold operational intent, ownership, priority and resolution. Many messages can belong to one enquiry, and a booking request can itself be converted into a booking.
- Emails from verified inbound provider appear with source/received metadata; without provider, show transactional outbound history only and display `Inbound sync not connected`.
- Draft -> queued -> provider accepted/sent -> delivered/bounced where provider supports it. Do not mark a message sent on local save.
- Sensitive attachments require scan, size/type limits, private storage and auditable access.

## 6. Intelligence Center data lifecycle

```mermaid
flowchart TD
  Events[Orders + payments + bookings + stock + inbox events] --> DB[(Authoritative records)]
  DB --> Agg[Permission-aware metric queries / read models]
  Agg --> KPIs[Seven headline KPI cells]
  Agg --> Trends[Revenue + order trend charts]
  Agg --> Signals[Deterministic threshold rules]
  Signals --> Actions[Collector opportunities / alerts / key takeaways]
  Actions --> Drilldown[Deep-link filtered records]
  Drilldown --> Detail[Authorized details and actions]
```

- Every numerical insight cites its calculation window, denominator and last-refresh time.
- Prefer deterministic rules (e.g. >3 product views in 7 days **with tracking consent**) until event instrumentation supports reliable models.
- Paid revenue is never computed from invoice issue alone.
- Historic screenshots/seed data never substitute for real read model results.

## 7. Exception matrix

| Event | System action | User-facing response |
|---|---|---|
| Duplicate order POST | Return existing order by idempotency key | One order reference only |
| Edition inventory exhausted | Reject order/hold; don't allocate | Sold out / offer contact or alternate work |
| Failed invoice email | Retry outbox; flag to staff | Order still received; do not claim email sent |
| Payment webhook duplicated | Ignore duplicate after recording first | No duplicate receipt/edition number |
| Payment amount mismatch | Quarantine/unmatched payment | Finance review needed, order not paid |
| Payment after stock hold expires | Reconcile money; hold allocation; raise exception | Studio contacts customer about options |
| Booking collision | Block confirmation and offer alternate date | Request remains tentative |
| Inbound email disconnected | No simulated inbound history | Inbox shows `Not connected` |
| Marketing consent missing | Suppress contact from campaign | Staff can still send permissible transactional updates |
| Permission denied | 403 + safe audit signal | No private data or button side effects |
| PDF generation unavailable | Retry job and surface document exception | No false invoice attachment claim |

## 8. User feedback / notifications

Use short, factual messages: “Order received — awaiting payment”, “Invoice issued”, “Payment verified”, “Booking request received”, “Booking confirmed for [date]”, “Message queued”, “Email failed — retry available”, “Edition allocation blocked — stock exception”. Do not label drafts `Sent`, unpaid invoices `Paid`, or tentative requests `Confirmed`.

## 9. Email timeline templates (content and triggers)

| Trigger | Email subject concept | Attachment / action |
|---|---|---|
| Order accepted for processing | `LGNDRY | We've received order [reference]` | Invoice PDF, pay link + QR, next steps |
| Payment verified | `LGNDRY | Payment confirmed for [reference]` | Receipt, preparation timeline |
| Order dispatched | `LGNDRY | Your artwork is on its way` | Tracking and support contact |
| Booking request received | `LGNDRY | Your photography request` | Request summary, review expectations |
| Quote issued | `LGNDRY | Your photography quotation` | Quote PDF/link, expiry, acceptance action |
| Deposit invoice issued | `LGNDRY | Deposit invoice for [booking reference]` | Pay link + QR, booking condition |
| Shoot confirmed | `LGNDRY | Your session is confirmed` | Calendar details / preparation instructions |
| Invoice overdue | `LGNDRY | Invoice [reference] payment reminder` | Updated payable balance, payment link |

All sends must use approved templates, opt-in/out rules as applicable and provider status tracking.
