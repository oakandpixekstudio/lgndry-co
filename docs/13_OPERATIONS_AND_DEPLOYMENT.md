# 13 — Operations, Release, Support and Deployment Runbook

**Purpose:** ensure the CRM can be operated, monitored and recovered once it becomes a real business system. Nothing in this handoff is deployed yet.

## 1. Environments and ownership

| Environment | Intended use | Restrictions |
|---|---|---|
| Local | UI development, unit/integration work | synthetic contacts and mock gateways only |
| Staging/UAT | business acceptance, provider sandbox, performance/visual tests | production secrets/data prohibited without authorization/anonymization |
| Production | real orders/bookings/customers/payments | MFA + RBAC + verified providers + monitored backups |

Require separation of service credentials, Supabase projects, storage buckets, email sender configuration and payment merchant credentials per environment. `DEMO_MODE` must be false in production and enforceably cannot use demo seeded records.

## 2. Deployment checklist

- [ ] Target branch protected; lockfile committed; CI lint/typecheck/unit/security tests passing.
- [ ] SQL migrations reviewed and applied to staging; RLS/grants checked; backup/restore test passed.
- [ ] Visual QA for sidebar/dash at baseline desktop and mobile; keyboard/accessibility checks done.
- [ ] Production database and auth/staff invites configured with MFA.
- [ ] Approved legal issuer identity, VAT handling, invoice numbering, refund policy, website terms and privacy notice.
- [ ] Production payment gateway credentials verified; webhook signature/amount matching tested in live-safe environment.
- [ ] Transactional sender domain SPF/DKIM/DMARC or provider-equivalent configuration verified; email templates reviewed.
- [ ] QR PDF tested on printed and phone screens; Pay Invoice link and expired/revoked behavior verified.
- [ ] Public form rate limits and spam protection enabled; file uploads restricted.
- [ ] Observability, alert destinations, job retries and dead-letter review defined.
- [ ] Rollback method and owner/contact available.
- [ ] UAT sign-off captured from Owner, Finance, Studio Manager and Engineering.

## 3. Critical scheduled jobs

| Job | Suggested cadence | Controls |
|---|---|---|
| Expire unpaid edition reservations | every few minutes | idempotent release; don't release verified paid reservations |
| Invoice overdue/reminder scan | daily | only approved policy and customer-safe send windows |
| Payment webhook retries | immediate + exponential backoff | dedupe by provider event ID; inspect dead letter |
| Email outbox processor | continuous/short intervals | transactional idempotency and delivery state |
| Booking quote/tentative-hold expiry | scheduled per configured policy | no mutation of confirmed sessions |
| Intelligence read-model refresh | event-driven/short interval | freshness timestamp and reconciliation tests |
| Backups | daily or managed provider schedule | restore testing and restricted retention |
| Integration health check | scheduled | alert disconnected sender/provider, avoid misleading status |

## 4. Common incidents

### Payment received, invoice still unpaid

1. Do not click `Mark Paid` without verified evidence. Check payment provider dashboard by transaction reference and expected merchant account.
2. Inspect webhook logs for signature status, retry, amount/currency mismatch or unknown invoice ref.
3. Reconcile via authorized Finance workflow. If replaying provider event, ensure dedupe/transaction safety.
4. Record resolution, actor and correlation ID. Confirm no duplicate edition number or booking.

### Two customers want the last edition

1. Review active reservations/expiry and allocated paid numbers; do not manually increment cap.
2. If payment already settled for unavailable stock, open Finance exception and customer contact task.
3. Resolve with customer-approved alternative/refund, record case. Add concurrency regression test.

### Booking conflict after deposit

1. Stop automatic confirmation; place booking in `SCHEDULING_EXCEPTION` queue.
2. Verify deposit and availability; offer alternative slot or refund under approved policy.
3. Do not double-book resources and do not hide the exception from Studio Manager.

### Invoice PDF/QR link fails

1. Verify invoice snapshot, document-generation job, current payment-session status and token expiry.
2. Regenerate a **new session link** only through authorized action; old link invalidated when appropriate.
3. Do not change issued invoice totals to fix a payment-link issue; publish corrected document if legally required.

### Outbound email fails

1. Confirm provider integration, sender domain and queue state; check bounce and suppression.
2. Retry via outbox with same idempotency key. Never create duplicate invoice or financial event.
3. Notify staff if delivery to customer remains unconfirmed.

### Unauthorized access or PII incident

1. Contain sessions, tokens, provider keys and affected endpoints; preserve logs/evidence.
2. Investigate scope, affected data, processor obligations and root cause.
3. Escalate to designated security lead/Information Officer and appropriate legal counsel; assess POPIA notifications promptly.
4. Patch, regression test, document incident and follow-up controls.

## 5. Monitoring dashboard and alerts

Track: order submit error rate; outstanding unpaid invoices; payment verification mismatches; webhook retries/dead letters; edition allocation constraint violations (must be zero); booking conflict count; outbound email failures; signed download failures; elevated role changes; rejected auth; long dashboard query latency; storage capacity and backup health.

Assign an owner and escalation channel for each alert. Do not generate operational noise without a person responsible for response.

## 6. Backup/recovery

- Managed daily database backup plus storage object/version and config backups; test restoration on isolated environment.
- Initial proposed recovery objectives: RPO <=24h, RTO <=8h. These are targets until validated, not guarantees.
- Restoring a backup that predates settled payment events requires **reconciliation** from provider ledger before resuming payment/edition processing.
- Preserve financial audit and invoice history through restore procedure; exercise recovery with duplicate webhook events.

## 7. Launch and acceptance artifacts

- `docs/10_QA_AND_ACCEPTANCE.md` signed UAT grid.
- Current schema/migration checksum, app version/commit ID and deployment record.
- Provider connectivity test results, invoice QR/receipt examples using synthetic data.
- Role matrix test output, RLS policy review, backup restore evidence.
- Privacy/legal/business configuration approvals.
- Runbook owners, incident contact list and rollback steps.

## 8. Operational discipline

**One source of truth:** invoice/payment ledger and booking/edition domain records are authoritative. Do not solve workflow defects with a staff-maintained shadow spreadsheet. A correction should be an audited domain action that the UI exposes with correct permission and traceability.
