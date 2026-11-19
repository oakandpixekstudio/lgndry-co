# 07 — API Contracts, Payments, QR, Email and Integrations

**Design status:** proposed route/resource contract. Use typed DTO schemas and OpenAPI generation when implemented. Exact route shapes may be adjusted without breaking domain rules.

## 1. API design principles

- `Content-Type: application/json`; JSON bodies validated at ingress; strict allowlisted fields; ids as UUID internally and human refs in public views.
- Routes grouped by trust: `/api/public/*` (untrusted, narrow/rate-limited), `/api/internal/*` (staff auth/RBAC), `/api/webhooks/*` (signature verified; no staff session).
- `X-Idempotency-Key` required for public order creation, payment-session creation and privileged financial operations.
- Sanitize error output: error code, safe message, correlation ID; never leak internal query or payment-provider secrets.
- All totals calculated from canonical DB price/tax/delivery configuration. Never trust money amounts submitted from the website.
- Cursor pagination for list endpoints, stable sort, server-side filters and field-limited projection.

## 2. Key public routes

| Method | Route | Input | Output |
|---|---|---|---|
| `GET` | `/api/public/catalog` | status, collection, cursor | published artwork/variant metadata, availability hint |
| `POST` | `/api/public/orders` | contact, line choices, address, policy acceptance and idempotency key | new order ref, `AWAITING_PAYMENT`, pay next-step metadata |
| `GET` | `/api/public/orders/{opaqueLookup}` | signed lookup token | safe order status only, no PII leak |
| `POST` | `/api/public/booking-requests` | contact, service, preferred times, brief, consent notice | booking reference, `REQUESTED` |
| `GET` | `/api/public/payment/{opaqueToken}` | opaque token | server redirects to valid provider-hosted checkout or safe error |
| `POST` | `/api/webhooks/payments/{provider}` | provider event + verified signature | `200` only after safely accepted/queued; idempotent |
| `POST` | `/api/webhooks/email/{provider}` | verified provider delivery event | update message delivery state only |

**Public data safeguards:** guest order lookup tokens must be sufficiently random, scoped to one order, expire, and disclose only necessary status. Use separate signed link flows for documents or identity verified access.

### Example order creation

```http
POST /api/public/orders
X-Idempotency-Key: 3f6f651e-0b39-42dc-bbf8-2f8c64b69d23
Content-Type: application/json
```

```json
{
  "customer": { "name": "Example Collector", "email": "collector@example.test", "phone": "+27000000000" },
  "items": [{ "artworkVariantId": "8a683b5e-585e-4c4d-a7b1-6e59fb77a346", "quantity": 1 }],
  "delivery": { "methodId": "standard", "city": "Johannesburg", "country": "ZA", "postalCode": "2000", "line1": "Example street" },
  "acceptedTermsVersion": "2026-11-v1",
  "marketingOptIn": false
}
```

**Response example (not actual pricing):**

```json
{
  "orderReference": "LG-ORD-2026-000123",
  "status": "AWAITING_PAYMENT",
  "currency": "ZAR",
  "totalCents": 620000,
  "message": "Order received. An invoice/payment request will be sent to your email.",
  "invoiceReference": "LG-INV-2026-000123",
  "paymentStatus": "PENDING",
  "nextStep": "CHECK_EMAIL"
}
```

Server must not imply that email was sent until the provider confirms it; response can say it is being prepared/queued. If payment provider not configured, do not generate an unsafe fake checkout link.

## 3. Key staff API routes

| Group | Methods / examples | Required policy |
|---|---|---|
| Intelligence | `GET /api/internal/intelligence?from=&to=` | `overview.read` + filtered metrics |
| Customers | `GET/POST /api/internal/customers`, `GET/PATCH /customers/:id`, `POST /customers/:id/merge` | `customers.read/create/update/merge` |
| Orders | `GET /orders`, `POST /orders`, `GET /orders/:id`, `POST /orders/:id/transition` | scoped `orders.*` |
| Editions | `GET /editions`, `POST /editions`, `POST /editions/:id/approve-change` | `editions.*` + approval |
| Bookings | `GET/POST /bookings`, `POST /bookings/:id/quote`, `POST /bookings/:id/confirm`, `GET /calendar` | `bookings.*`/resource access |
| Invoices | `GET /invoices`, `POST /invoices/:id/issue`, `GET /invoices/:id/pdf`, `POST /invoices/:id/send`, `POST /invoices/:id/void` | finance authorization |
| Payments | `GET /payments?invoiceId=`, `POST /payments/manual-reconcile`, `POST /payments/:id/refund` | Finance + dual-control when configured |
| Enquiries | `GET/POST /enquiries`, `PATCH /enquiries/:id`, `POST /enquiries/:id/resolve` | assigned cases or manager |
| Inbox | `GET /threads`, `GET /threads/:id`, `POST /threads/:id/drafts`, `POST /threads/:id/send` | message scope + sender identity |
| Campaigns | `GET/POST /campaigns`, `POST /campaigns/:id/approve`, `POST /campaigns/:id/send` | approval + consent + provider configured |
| Insights | `GET /insights`, `GET /signals/:id/evidence` | permission aware |
| Settings | `GET/PATCH /settings`, `GET/POST /staff`, `POST /staff/:id/revoke` | privileged roles |

Actual Next.js route handlers may be placed under `apps/studio/src/app/api/internal/`; shared domain services remain under packages.

## 4. Server-side financial contracts

**PaymentGateway interface (illustrative):**

```ts
interface PaymentGateway {
  createHostedSession(input: {
    invoiceId: string;
    amountCents: number;
    currency: 'ZAR';
    successUrl: string;
    cancelUrl: string;
    idempotencyKey: string;
  }): Promise<{ sessionId: string; hostedUrl: string; expiresAt: string }>;
  verifyWebhook(input: { rawBody: Uint8Array; signatureHeaders: Record<string, string> }):
    Promise<{ eventId: string; eventType: string; providerPaymentId?: string; sessionId?: string }>;
  fetchPaymentStatus(providerPaymentId: string): Promise<{
    status: 'SETTLED' | 'PENDING' | 'FAILED' | 'REFUNDED';
    amountCents: number;
    currency: string;
    merchantReference: string;
  }>;
  refund?(input: { providerPaymentId: string; amountCents: number; reason: string }): Promise<{ refundId: string }>;
}
```

Providers can be chosen later after checking South African settlement/hosted checkout and QR capabilities. **Do not assume a specific provider supports every API without verifying its official current documentation.** Use a secure mock provider only in local/staging, with explicit labels. In production, absence of provider means disabled live payment action.

**Payment verification minimum:** signature + event replay check, provider transaction retrieval when warranted, merchant/account scope, invoice session match, exact currency/amount and status, unique ledger/event records. State changes are atomic with business side effects.

**QR generation:** construct `https://<approved-domain>/pay/<opaque-token>`, render as error-corrected QR in PDF/email web preview using audited QR library, and show a clickable payment link for mobile users. QR token is not a password-reset token or a customer-data container. Never generate QR as AI artwork.

## 5. Email provider interface and delivery semantics

```ts
interface TransactionalEmailProvider {
  send(input: {
    to: string;
    templateId: string;
    subject: string;
    variables: Record<string, unknown>;
    attachmentAssetIds?: string[];
    idempotencyKey: string;
  }): Promise<{ providerMessageId: string; acceptedAt: string }>;
}
```

**Outbox:** commit notification intent with business transaction -> async job renders template and PDF -> call provider -> record accepted message ID -> process delivery/bounce webhooks. Add deterministic retries with backoff, duplicate prevention and dead-letter review. Never mark a draft “sent” merely because it was saved.

**Transactional templates:** order received with pending-payment wording, invoice issued/QR, payment confirmed, dispatch, booking request, quote, deposit, confirmed shoot, delivery, overdue reminder. Copy in `03_APPLICATION_WORKFLOWS.md`. All templates should use approved sender domain and branding.

**Inbound Inbox (P1):** separate `InboundEmailProvider` adapter using OAuth for Gmail or Microsoft 365, verify push notifications, sync message thread metadata, match customers by verified email, sanitize HTML, dedupe by provider message ID, allow unlink/reassign, support delete/retention. Do not pretend incoming email is available before authorization and connector configuration.

## 6. Invoice/PDF contract

- Generate immutable PDF from invoice snapshot; preserve PDF hash and template revision.
- Show invoice serial and date, approved issuer and VAT details, customer, line descriptions/quantities/prices, taxes where applicable, amount due, due date, payment terms, payment link and QR.
- `GET /api/internal/invoices/{id}/pdf` issues short-lived signed download after permission check. The customer receives the document as a protected attachment or a short-lived safe customer link.
- PDF may contain a QR pointing to a gateway page; the gateway is responsible for collecting card details.
- Changes to issued invoices use approved credit/void or adjustment flow, not in-place editing of historical tax information.

## 7. API errors and data states

```json
{
  "error": {
    "code": "EDITION_UNAVAILABLE",
    "message": "This edition is no longer available. Please select another option.",
    "requestId": "req_example_001"
  }
}
```

Suggested codes: `VALIDATION_ERROR` (400), `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `IDEMPOTENCY_CONFLICT` (409), `BOOKING_CONFLICT` (409), `EDITION_UNAVAILABLE` (409), `PAYMENT_SETUP_REQUIRED` (503/explicit operational), `WEBHOOK_SIGNATURE_INVALID` (401/400), `RATE_LIMITED` (429). Keep 5xx errors generic in public responses.

## 8. Required external configuration

| Variable/key | Location | Needed for |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser-safe config | client SDK |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser-safe config | client SDK (RLS still required) |
| Supabase service credential | server secret manager | privileged migrations/jobs only |
| Payment merchant secret/webhook secret | server secret manager | hosted session + signed verification |
| Transactional email API key | server secret manager | external send |
| Sender domain | business config | verified transactional mail |
| `APP_BASE_URL` / `PAYMENT_BASE_URL` | config | verified links and callback URLs |
| `DEMO_MODE` | environment config | synthetic data isolation |
| Booking/calendar policies | workspace settings | resource conflicts, deposit timing |
| Legal issuer / tax status | workspace settings, owner-approved | proper invoice fields |

## 9. API integration test conditions

- Tampered client price does not affect server total; the request either ignores or rejects it.
- Same idempotency key (same payload) creates one order/invoice; altered payload with same key rejects.
- Webhook with invalid signature does nothing; duplicate valid event is no-op after first update.
- Expired/void QR cannot pay the wrong invoice or reuse stale amount.
- Inbound message HTML script is sanitized; attachments not publicly browsable.
- Staff role check is repeated in every route/action even if UI button is hidden.
- Transactional send failures are visible and retryable; a customer-facing receipt is not marked delivered unless provider says so.
