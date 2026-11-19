# 08 — Intelligence Center: Metrics, Signals and Reporting Rules

**Purpose:** make the flagship dashboard a reliable decision centre rather than a visual demonstration.  
**Source screenshot:** illustrative (R184,260, 32 orders, 19 collectors, 08 booking requests, 98% fulfilment, 41% repeat, 03 open enquiries). These figures must be replaced by computed data in production.

## 1. Measurement principles

1. Every metric has a label, unit, calculation method, measurement window, filter, source table/event and last refreshed timestamp.
2. Never confuse `invoiced amount`, `paid amount`, `cash collected`, `gross merchandise value` and `accounting revenue`. The dashboard may show cash-based **operational receipts** until Finance confirms accounting-recognition rules.
3. Use verified payment ledger events rather than UI-submitted “payment success” or merely issued invoices.
4. ZAR money is stored/calculated in cents. Round/display only at presentation boundaries.
5. All periods use Africa/Johannesburg display dates, stored as UTC range boundaries; default last 30 completed or rolling days (choose and label consistently; recommended rolling 30-day period).
6. Compare with immediately prior same-length period. For percentage change `100*(current-previous)/previous`; if previous=0 show `New`/`N/A` rather than infinity.
7. Exclude demo records in production. Allow internal demo environment seeded counts only with a clear `DEMO DATA` badge.
8. Every card click opens a permission-filtered matching list; maintain analytics/log-level access restrictions.

## 2. KPI dictionary (top rail)

| KPI | Canonical rule | Drill-down |
|---|---|---|
| **Revenue (30 days)** | Verified settled customer receipts minus settled refunds, excluding collected VAT (where applicable). Include print payments and booking deposits/balances **once each**. Finance may later expose recognized revenue separately; tooltip `Operational receipts, not accounting recognition`. | Payments with source order/booking, date and amount |
| **Orders** | Count distinct new orders submitted in range, excluding draft/test; cancellations may remain counted but segmented. A separate paid-orders metric must be available. | Orders filtered by `placed_at` |
| **New collectors** | Count distinct customers with first actual qualifying paid art purchase in range; do not count a newsletter sign-up as a collector. Use `new customers` if counting any source. | Customer profiles with first purchase |
| **Booking requests** | Count newly created photography booking requests, regardless of confirmation; separate conversion to confirmed bookings. | Bookings filtered to `REQUESTED` cohorts |
| **Fulfilment health** | `eligible paid orders on or ahead of fulfilment SLA / eligible paid orders × 100`. Exclude void/unpaid orders; handle no eligible denominator as `N/A`. | Paid fulfilment records and SLA exceptions |
| **Repeat clients** | Among unique customers who made a qualifying paid purchase/booking payment in the period, percentage with at least one qualifying earlier completed transaction. Define combined/print-only breakdown. | Cohort customer list |
| **Open enquiries** | Count `enquiries` not resolved/cancelled at time of query, optionally emphasize those past due. | Enquiries filtered to open/overdue |

**Terminology conflict:** screenshot uses `Revenue`, `gross sales` and `collectors` visually. Engineering should use the defined metric family, keep a context tooltip, and only call a number `Accounting Revenue` after finance recognition rules are established. This preserves appearance without misreporting cash.

## 3. Sales chart

- Default dual-series: monthly or weekly verified cash receipts (neutral bars) and paid order counts (black line) for the selected timeframe. Both series must have clearly separate units/axes or a tab toggle (never plot unrelated scales without annotation).
- Toggle `REVENUE` / `ORDERS` as shown in screenshot; expose accessible table with same values for keyboard/screen-reader users.
- Hover includes start/end period, value, comparison and count; final bar/marker uses dark ink.
- Dates and category breakdown: prints, photography bookings, deposits, delivery charges, adjustments/refunds. If category mixing is not meaningful, show separate chart filters.

## 4. Collector intelligence (explainable rules)

| Signal | Proposed deterministic rule | Caveat/action |
|---|---|---|
| **High-intent collector** | Identified customer with >=3 relevant artwork page views in last 7 days and a lawful/consented tracking basis, not yet purchased that edition | Show `3 views / 7 days`, source timestamp and link to customer; don't stalk anonymous visitors |
| **Repeat-purchase opportunity** | Customer with >=1 past paid art order and opted-in/appropriate contact basis, no art purchase in configured 90–180 day window | State `suggested follow-up` rather than predicted purchase |
| **Growing limited-edition interest** | Percentage lift in consenting identifiable visits or aggregate sessions to edition pages vs equal previous period, with minimum denominator threshold | If denominator too small, suppress percentage or mark `insufficient data` |
| **Collector retention** | Verified repeat rate per dictionary | Never infer lifetime loyalty from one month alone |
| **VIP** | Rules based on paid transaction count/value thresholds set by owner; manually assigned VIP separately tagged | Threshold must be configurable, not hard-coded |

If lawful tracking instrumentation does not exist, hide/disable browsing-based signal cards and instead show first-party operational signals (unpaid invoices, recent enquiry, repeat buyer history) with honest labels. No generic AI-generated “likely to buy” without data science validation.

## 5. Booking intelligence

| Signal | Calculation |
|---|---|
| Upcoming shoots | Count confirmed future sessions within chosen lookahead (default next 14 days), excluding cancelled |
| Booking pipeline | Count active booking requests between Requested and Confirmed excluding completed/cancelled |
| Pending requests | Count requests awaiting first studio response or quote decision; definition shown in tooltip |
| Quote-to-confirmed conversion | Confirmed booking requests / quotes issued in same qualified cohort, measured with cohort window |
| Average response time | Time from booking request receipt to first genuine staff reply (business-hours variant optional) |
| Deposit conversion | Booking quotes accepted with verified deposit / accepted quotes eligible for deposit |
| Calendar utilisation | Confirmed resource hours / available bookable resource hours; only if resource schedules are configured |

Booking alerts must not treat a *request* as a confirmed shoot. Link metrics to actual bookings/booking sessions.

## 6. Edition and fulfilment intelligence

- **Edition availability** = `max_copies - allocated_paid_numbers - unexpired_active_reservations`. Distinguish available to purchase from sold/paid count. Inventory is transactionally enforced.
- **Low-edition alert** when saleable capacity <= configured threshold and release is active; include artwork, run, reserved, paid allocated and limit.
- **In production** counts paid, undelivered order lines in production state.
- **In transit** counts shipped, not yet delivered orders (or shipments consistently defined).
- **Delivered (30 days)** counts orders with a trusted delivery event within range; late deliveries included but flagged.
- **Top-selling editions** ranks paid allocated units per run within range (not initial order submissions).
- **Stuck production** flags orders exceeding approved SLA thresholds by stage, with ownership and last update.

## 7. Invoice and cash intelligence

- Outstanding balance: issued, non-void invoices' legally valid remaining balance, including booking balance invoices; age buckets 0–7, 8–30, 31–60, 61+ days from due date.
- Paid invoice rate: fully paid invoices / invoices issued in a cohort, with partial state separate.
- Average days-to-payment: days from issued_at to full paid_at for fully settled cohort.
- Failed reconciliation/webhooks: count unresolved payments needing Finance attention; avoid double-counting retries.
- Booking deposit exposure: sum of confirmed bookings' expected deposits not yet verified.

## 8. Studio Insights and command notes

The `Studio intelligence` and `Key takeaways.` panels should be assembled from a small set of **rule-based, auditable queries**, for example:

1. “Invoice follow-up: 4 invoices are overdue by 7+ days.” -> Invoices page with overdue filter.
2. “Production priority: 2 paid orders exceeded the framing target.” -> Orders filtered by SLA.
3. “Booking opportunity: 3 approved quotes await deposit.” -> Bookings filtered to Awaiting Deposit.
4. “Edition watch: 2 active runs have <=3 copies available.” -> Edition runs filtered to low stock.
5. “Customer engagement: 5 repeat collectors have open replies.” -> Inbox filtered by linked repeat customer + needs reply.

**Prohibition:** no unsupported statements such as “12 clients likely to collect again” without a documented and calibrated rule. Rule-driven “12 past collectors eligible for follow-up” is acceptable with a visible explanation.

## 9. Dashboard filtering and freshness

- Date range controls: last 7/30/90 days, this month, custom; show exact range used.
- Sales metrics filtered by payment settlement date; order volume by submission date; bookings by request date; future shoots by scheduled date. Do not silently apply one date semantics to all.
- Default last refreshed timestamp; invalidate/recompute affected metrics after authoritative state changes; target refresh under 60 seconds for operational panels, batch aggregations where necessary.
- If analytics provider/tracking not connected, show `Not enough data` or `Tracking not configured`, not fake zero or sample forecast.
- Comparison baselines and event derivations must be testable with small fixture datasets.

## 10. Event instrumentation minimum

Required first-party events: `order_submitted`, `invoice_issued`, `payment_verified`, `payment_refunded`, `edition_reserved`, `edition_allocated`, `order_dispatched`, `order_delivered`, `booking_requested`, `quote_sent`, `quote_accepted`, `deposit_verified`, `booking_confirmed`, `shoot_delivered`, `enquiry_opened`, `enquiry_replied`, `enquiry_resolved`, `message_sent`, `message_failed`. Optional/consent-aware: `artwork_viewed`, `catalog_search`, `checkout_started`. Each event has `event_id`, `source`, `occurred_at`, `workspace_id` and relevant resource ID; event idempotency required.

## 11. Data quality tests

- Paid revenue changes once, not multiple times, when duplicate payment webhook arrives.
- Refund reduces net cash receipt and changes invoice balance per defined accounting rule.
- Booking deposit and balance are not counted twice or mixed with invoice face value.
- Percentage with zero previous-period denominator is not displayed as +infinity%.
- A customer with one uncompleted/order-only interaction is not a repeat customer.
- An expired edition hold increases saleable availability without reducing already allocated numbers.
- KPI drilldown filter returns same source population used in calculation.
- Non-consenting customer is excluded from identified browsing-based signals.
