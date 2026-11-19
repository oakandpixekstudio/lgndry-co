# 04 — Security, Privacy and Access Control Specification

**Data classification:** internal CRM; processes personal contact data, private customer communications, photography bookings, financial documentation, payment metadata, staff accounts and possibly sensitive creative briefs.  
**Control model:** authenticated staff + least-privilege RBAC + row-level security (RLS) + audited domain actions; separate constrained public endpoints.

## 1. Threat model and trust boundaries

Threats to address: unauthorised staff access; account takeover; invoice tampering or fraudulent payment redirection; public form spam; duplicate webhook replay; stolen hosted-payment links; SQL/data exposure; excess customer data in analytics; malicious email/file attachments; internal misuse; mistaken demo/production mixing; cross-workspace access; incorrect financial status; edition overselling; calendar abuse.

Trust boundary map:

- **Browser:** all input untrusted. UI gating provides convenience only; it is **not** authorization.
- **App server:** authenticated identity checks, session verification, role checks, Zod validation, safe output DTO, idempotency, webhook signature checks and audit.
- **Database:** RLS for every exposed table, explicit grants, constraints, immutable ledgers, transactions and separate service-only access for highly privileged jobs.
- **External providers:** hosted payments, transactional email and inbound sync have narrow-scoped credentials and verified callbacks.
- **Public storefront:** rate-limited public order and booking actions only. No direct use of elevated DB keys.

## 2. Roles and permission abbreviations

Roles (one person may have more than one additive role; no automatic `*` implied):

- **Owner**: legal business owner, staff/finance configuration, privileged review.
- **Admin**: staff access and operations administration; may not bypass financial dual-control by default.
- **Finance**: invoices, payments, credits/refunds, reconciliation, tax configuration by approval.
- **Studio Manager**: day-to-day booking/order assignments and production oversight.
- **Collector Relations**: customers, sales, enquiries, approved outbound replies.
- **Photographer**: assigned shoots, briefs, schedule and deliverables only.
- **Fulfilment**: paid print production, packing and dispatch records.
- **Analyst**: approved read-only operational and aggregate views.

**Permission verbs:** `R`=read; `C`=create; `U`=update operational fields; `A`=approve/issue; `X`=void/cancel/refund with reason; `E`=export. No permission means forbidden.

## 3. Initial RBAC matrix

| Resource/action | Owner | Admin | Finance | Studio Manager | Collector Relations | Photographer | Fulfilment | Analyst |
|---|---|---|---|---|---|---|---|---|
| Intelligence Center / aggregated KPIs | R | R | R | R | R limited | — | R limited | R |
| Customers / contact details | RCU E | RCU E | R | RCU | RCU | R assigned, minimal | R order contact only | — |
| Orders / creation & updates | RCU X | RCU X | R & financial updates | RCU | RCU | — | R/U fulfilment only | R aggregate |
| Edition catalog / stock | RCU A | RCU A | R | RCU | R | — | R/U paid allocation workflow | R aggregate |
| Bookings / requests and calendar | RCU X | RCU X | R financial | RCU X | RCU | R/U assigned tasks | — | R aggregate |
| Invoice view/download | R | R | RCU A X E | R linked (non-tax edit) | R linked payment status only | — | R linked paid status only | R aggregate |
| Mark payment verified / refund | A X (dual-control) | — | A X (dual-control) | — | — | — | — | — |
| Enquiries / assignment/resolution | RCU | RCU | R financial | RCU | RCU | R assigned | — | R aggregate |
| Inbox / customer conversations | R | R | R invoice threads | RCU | RCU | R assigned session threads | — | — |
| Campaign drafts | RCU A | RCU A | — | RCU | RCU | — | — | R aggregate |
| Campaign broadcast | A | A (configured approval) | — | — | C/U drafts only | — | — | — |
| Insights / client-level analysis | R | R | R financial | R operational | R portfolio | — | R fulfilment only | R anonymized |
| Staff management / permissions | A | A (cannot self-elevate) | — | — | — | — | — | — |
| Payment/email provider secrets | A (limited admin UI) | configuration view only | integration status | status only | — | — | — | — |
| Audit logs / security events | R E | R E | R finance events | R operational own | R own actions | R own actions | R own actions | — |

This is an initial matrix and must become a machine-readable policy and corresponding test suite. **Owner** and Finance do not automatically authorize each other's refund without a second approver above the configured threshold. The system must support maker-checker for high-risk financial actions; threshold is a configuration decision.

## 4. Contextual access rules

- Assigned photographers can view only their bookings plus the minimum client contact/brief details required to deliver the assignment; no global collector list, spending history or unrelated invoices.
- Fulfilment can see customer shipping details for assigned/eligible paid orders but not financial instruments or general personal notes.
- Collector Relations may view payment status but not manually mark paid or edit issued invoice totals.
- Analyst receives aggregated or appropriately de-identified insights; no raw export of personal customer data.
- Admin cannot edit their own effective role to Owner or Finance; role changes recorded and require Owner authorization for elevated roles.
- `workspace_id` limits data to LGNDRY's studio workspace. The initial product is single-company; workspace isolation is an implementation boundary, not public multi-tenant SaaS marketing.
- Revoked/disabled staff identities lose access to existing sessions and signed links as applicable.

## 5. Authentication and sessions

- Staff account invitations by authorised admin, email verification, strong password rules or enterprise SSO when available.
- **MFA required for Owner, Admin and Finance** before production financial operations; recommend all staff use MFA.
- Secure HttpOnly session cookies, `Secure`, appropriate `SameSite`, session lifetime/rotation, CSRF protection for cookie-based state changes, rate limits for login and reset flows.
- Do not store access tokens in localStorage. Avoid logging reset tokens, credentials, OAuth tokens or 2FA secrets.
- Password reset and changed permissions revoke/re-evaluate sessions; lock or challenge suspicious login attempts.
- Privileged actions require server-side fresh authorization, optionally step-up authentication.

## 6. Database rules (Supabase)

- Use PostgreSQL RLS on each exposed table and explicit grants, not just policy definitions. `anon` gets no direct access to CRM tables; public APIs use server-enforced, tightly scoped operations.
- Only authenticated users with active `workspace_memberships` may access workspace rows, subject to role, entity assignment and field-level restrictions in the server data-access layer.
- Separate queries for public view data from private customer data; design safe DTOs (e.g. shipping contact only for Fulfilment).
- Service-role key may bypass RLS: limit to server-only secret manager and dedicated audited workers. Client bundles must contain only publishable keys.
- Finance tables: `payments`, `invoice_snapshots`, `audit_logs`, `webhook_events` require restricted updates and append-only records where feasible; revocations/refunds are new entries rather than old row edits.
- Restrict backups, database migrations, storage policies and CI secrets by environment.
- Test RLS with at least two users in different roles, disabled users and a non-member identity. Test `anon` grants and policy behavior separately.

## 7. Payment and invoice security

- Provider-hosted payment page; never collect/store raw PAN, CVC or card number in Studio Desk.
- Invoice QR represents an **opaque, non-guessable, revocable/expiring URL** that resolves through a server endpoint to a provider-hosted session. It must not embed email/address/banking details.
- Verify payment webhook signature, timestamp/replay protection and source account; independently check invoice ID, amount due, currency, merchant and provider transaction status.
- `provider_event_id` and transaction reference unique; webhook replay cannot double-allocate edition numbers or trigger two booking confirmations.
- A client-side "payment completed" screen is **provisional** until server confirmation.
- Manual EFT verification restricted to Finance, evidence attached and reconciled against bank statement or authenticated bank feed; dual-control above a configurable amount. Screenshots alone are not sufficient.
- All issue/void/refund actions write actor, timestamp, before/after state and reason to append-only audit records.
- Set HTTP caching to private/no-store on customer records and signed payment/invoice destinations.

## 8. Inbox, uploads and communications

- Protect email provider connections with OAuth grants and minimal scopes; encrypt secrets at rest, scope access to workspace, provide disconnect/revoke.
- Validate inbound webhook signatures before displaying external sender content; render message bodies safely to prevent XSS and malicious HTML.
- Restrict attachment types/size, scan files and store privately. Virus-scan before exposing a download where possible.
- The reply composer may not impersonate arbitrary sender domains; use configured and authenticated LGNDRY sender identities only.
- Separate lawful transactional messages from marketing campaigns. Track explicit consent and suppression events.
- Queue delivery and process provider receipts; distinguish created/draft/queued/provider-accepted/bounced.

## 9. Privacy and South African regulatory considerations

The application must be designed with **POPIA** safeguards (technical and organisational protection, minimum necessary data, access controls, documented retention/disposal, operator agreements, breach-response records). POPIA sections 19 and 22 address reasonable safeguards and notification of security compromises. The Information Regulator and affected persons may need notice depending on the facts; counsel must review the actual incident and legal obligations. Source: https://www.treasury.gov.za/POPIA/POPI%20Act%204%20of%202013.pdf

The public order journey must account for **ECTA section 43**: supplier identity/contact, clear goods/services and full pricing, payment, delivery, record access, terms, privacy, return/cancellation policies and review/correction/withdrawal before order submission. Source: https://lawlibrary.org.za/akn/za/act/2002/25/eng%402021-12-01

**SARS tax invoices:** full tax invoices are subject to specific required fields and VAT vendor obligations. Whether and how LGNDRY issues tax invoices depends on verified VAT/vendor status and the actual transaction tax point. Source: https://www.sars.gov.za/businesses-and-employers/government/tax-invoices/

**Legal note:** these are engineering controls based on public sources, not a legal opinion. Confirm statutory details, information officer duties, VAT setup and relevant contractual terms with qualified local advisers before live trade.

## 10. Data retention and data subject requests

- Establish written retention schedule approved by owner/accountant/legal counsel per entity type: marketing data, general customer data, invoice/accounting records, staff access and logs, booking briefs/files, email and financial events.
- Default to minimal storage. Preserve legally required invoice/payment/audit history; fulfil erasure requests with anonymization/deletion when permitted; do not delete accounting records merely on request.
- Provide controlled access and export workflow for customer information requests; log request, identity check, decision, data transfer and completion.
- Prefer data residency/transfer assessments and processing agreements with cloud/email/payment providers; disclose processor use in privacy policy.

## 11. Security operational controls

| Control | Required outcome |
|---|---|
| Encryption | TLS 1.2+ in transit; provider-managed at-rest encryption; secret vault for credentials |
| Monitoring | alerts for failed admin logins, privilege changes, excessive exports, webhook-signature failure, mass notification errors |
| Backups | automated + documented restores; restrict backup access |
| Dependency security | lockfiles, CI scanning, security patch review, unused dependency removal |
| Configuration | production CORS allowlist, CSP/security headers, environment isolation, no debug leaks |
| Audit | immutable material state changes, actor/service principal and correlation ID |
| Security testing | OWASP-oriented tests; API authorization, RLS grants, input validation, replay and race conditions |
| Incident response | triage, containment, evidence, processor coordination and legal notification workflow |

## 12. Access tests (must pass)

1. Logged-out user cannot fetch any CRM records, even with a guessed record URL.
2. Photographer cannot read another photographer's customer/invoice records.
3. Fulfilment cannot mark invoice paid, issue refunds or access all customer notes.
4. Collector Relations cannot modify a paid amount via API request mutation.
5. Admin cannot self-promote to Owner/Finance via a changed JSON role or SQL grant.
6. Anonymous storefront order can submit validated checkout only through rate-limited route and cannot specify trusted price.
7. Invoice QR is opaque and revocable; expired/voided links do not authorize an old payment.
8. Duplicate webhook arrives 10 times: ledger and edition allocation still have one logical payment/number.
9. Untrusted email HTML cannot execute script in staff Inbox.
10. Production keys never appear in HTML/JS bundles, logs, seed files or repo.

## 13. Launch gates

Owner/Finance MFA, verified roles/RLS, working incident contacts, approved VAT/legal identity, payment provider and webhook validation, controlled PDF issuance, suppression/consent tests, restore test and penetration/security review are **go-live blockers** where relevant. If any provider is unavailable, leave its live actions disabled and mark the feature not connected; never silently downgrade payment verification.
