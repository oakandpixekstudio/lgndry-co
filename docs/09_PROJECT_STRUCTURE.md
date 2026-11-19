# 09 — Recommended Repository and Project File Structure

**Recommendation:** a small TypeScript monorepo, with **CRM as the first executable application**, shared business rules and provider interfaces. This is intentionally more structured than one giant HTML file, but not a microservice architecture.

## 1. Target tree

```text
lgndry-platform/
├── 00_CLAUDE_BUILD_PROMPT.md          # initial execution instruction; read first
├── CLAUDE.md                         # brief standing rules for Claude code sessions
├── README.md                         # build/run/environment documentation
├── .gitignore
├── .env.example                     # fake placeholders only
├── package.json                     # root workspace scripts
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── eslint.config.*
├── .github/
│   └── workflows/
│       ├── verify.yml              # lint/typecheck/unit/integration
│       └── security.yml            # dependency + secret/security checks
├── apps/
│   ├── studio/                      # IMPLEMENT NOW: LGNDRY CRM
│   │   ├── package.json
│   │   ├── next.config.*
│   │   ├── tailwind.config.*        # if required by installed Tailwind version
│   │   ├── public/
│   │   │   └── artwork-placeholders/  # demo only / appropriately licensed
│   │   └── src/
│   │       ├── app/
│   │       │   ├── layout.tsx
│   │       │   ├── globals.css
│   │       │   ├── (auth)/
│   │       │   │   ├── login/page.tsx
│   │       │   │   └── reset-password/page.tsx
│   │       │   ├── (studio)/
│   │       │   │   ├── layout.tsx   # FLOATING NAV + topbar
│   │       │   │   ├── overview/page.tsx
│   │       │   │   ├── customers/{page.tsx,[id]/page.tsx}
│   │       │   │   ├── orders/{page.tsx,[id]/page.tsx}
│   │       │   │   ├── editions/{page.tsx,[id]/page.tsx}
│   │       │   │   ├── bookings/{page.tsx,[id]/page.tsx,calendar/page.tsx}
│   │       │   │   ├── invoices/{page.tsx,[id]/page.tsx}
│   │       │   │   ├── enquiries/{page.tsx,[id]/page.tsx}
│   │       │   │   ├── inbox/{page.tsx,[id]/page.tsx}
│   │       │   │   ├── campaigns/{page.tsx,[id]/page.tsx}
│   │       │   │   ├── insights/page.tsx
│   │       │   │   └── settings/{page.tsx,staff/page.tsx,integrations/page.tsx}
│   │       │   └── api/
│   │       │       ├── public/
│   │       │       │   ├── catalog/route.ts
│   │       │       │   ├── orders/route.ts
│   │       │       │   ├── booking-requests/route.ts
│   │       │       │   └── payment/[token]/route.ts
│   │       │       ├── internal/
│   │       │       │   ├── intelligence/route.ts
│   │       │       │   └── [...rest]/   # or explicit resources
│   │       │       └── webhooks/
│   │       │           ├── payments/[provider]/route.ts
│   │       │           └── email/[provider]/route.ts
│   │       ├── components/
│   │       │   ├── layout/{floating-sidebar,topbar,mobile-nav}.tsx
│   │       │   ├── editorial/{display-heading,eyebrow,artwork-frame}.tsx
│   │       │   ├── shared/{data-table,filter-bar,record-drawer,modal,search-dialog}.tsx
│   │       │   └── charts/{sales-chart,chart-data-table}.tsx
│   │       ├── features/
│   │       │   ├── intelligence/{components,queries,signals}/
│   │       │   ├── customers/{components,actions,schemas}/
│   │       │   ├── orders/{components,actions,schemas}/
│   │       │   ├── editions/{components,actions,schemas}/
│   │       │   ├── bookings/{components,actions,schemas}/
│   │       │   ├── invoices/{components,actions,schemas}/
│   │       │   ├── enquiries/{components,actions,schemas}/
│   │       │   ├── inbox/{components,actions,schemas}/
│   │       │   ├── campaigns/{components,actions,schemas}/
│   │       │   ├── insights/{components,queries}/
│   │       │   └── settings/{components,actions}/
│   │       ├── lib/
│   │       │   ├── auth/{session,permissions}.ts
│   │       │   ├── data-access/{read-models,repositories}.ts
│   │       │   ├── validation/{common,money,datetime}.ts
│   │       │   ├── observability/{logger,correlation}.ts
│   │       │   └── supabase/{client,server,admin}.ts
│   │       └── styles/{tokens,typography}.css
│   └── storefront/                  # RESERVED for separate public e-commerce app
│       └── README.md               # document planned API use; defer implementation
├── packages/
│   ├── domain/
│   │   └── src/
│   │       ├── entities/{customer,order,edition,booking,invoice,message}.ts
│   │       ├── rules/{order-state,booking-state,edition-allocation,payment-reconciliation}.ts
│   │       ├── money/{cents,tax,totals}.ts
│   │       └── events/{domain-events}.ts
│   ├── database/
│   │   ├── supabase/migrations/     # reviewed SQL schema, policies, grants
│   │   ├── src/{repositories,transactions,rls-tests}/
│   │   └── seed/{demo,staging}.ts  # no real customer details
│   ├── integrations/
│   │   └── src/
│   │       ├── payments/{gateway,mock,provider}/
│   │       ├── email/{transactional,inbound,mock}/
│   │       ├── documents/{invoice-pdf,quote-pdf,qr}.ts
│   │       └── jobs/{outbox,expiry,reminders}.ts
│   └── design-system/
│       └── src/{tokens,components,icons}/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── security/
│   └── visual/{screenshots,baselines}/
├── docs/                            # PROVIDED markdown requirements
└── references/                      # PROVIDED original HTML + design target
    ├── lgndry-studio-crm-floating.html
    ├── LGNDRY-Intelligence-Center-target.png
    └── lgndry-editorial-storefront-optional.html
```

**Implementation note:** The `{page.tsx,[id]/page.tsx}` shorthand above is explanatory; create normal filesystem folders and separate `.tsx` files. Do not literally create filenames with braces. `apps/storefront` may remain only an intention in Phase 1 so the CRM can ship without building the whole public website.

## 2. Module boundaries

- `apps/studio` owns screens, navigation, browser interactions, server route handlers, presentation and request validation.
- `packages/domain` owns statuses, money rules, allocation invariants, eligibility and calculation logic. **No React imports or provider SDKs here.**
- `packages/database` owns SQL migrations/RLS, typed query/repository functions and transactional persistence.
- `packages/integrations` owns provider contracts, adapters, secure QR/document generation and reliable jobs.
- `packages/design-system` owns only LGNDRY-shared tokens/primitives; feature-specific components live in their feature.
- `docs` describes intended behaviour; migrations+tests become the authoritative technical proof after coding.

## 3. Build order and source migration map

| From approved HTML | Target component / service | Migration note |
|---|---|---|
| `.sidebar`, `.nav-btn` | `components/layout/floating-sidebar.tsx` | match screenshot; insert Bookings/Invoices/Inbox |
| `.topbar` and search overlay | `topbar.tsx`, `search-dialog.tsx` | preserve Ctrl/Cmd+K, real authorized server results |
| `overview()` template | `features/intelligence/*` + `/overview` | replace demo chart/KPIs, title with Intelligence Center |
| `customers()` and drawers | `features/customers/*` | preserve creation, segments/notes, add history/consent |
| `orders()` + `updateOrder()` | `features/orders/*`, domain state machine | remove local client-side paid allocation logic |
| `editions()` | `features/editions/*` | preserve gallery and stock view, add finite run locking |
| `enquiries()` | `features/enquiries/*` | expand case ownership; connect Inbox messages |
| `campaigns()` | `features/campaigns/*` | draft functionality; gate real marketing sends |
| `insights()` | `features/insights/*` | convert hardcoded data to metric services |
| `settings()` | `features/settings/*` | real configured roles/provider states; no fake toggles |
| `localStorage` seed | `packages/database/seed/demo.ts` | synthetic demo fixtures only; not production state |
| Missing: Bookings | `features/bookings/*` | new workflow and calendar |
| Missing: Invoices | `features/invoices/*` | new financial documents / QR payments |
| Missing: Inbox | `features/inbox/*` | new threaded communications UI |

## 4. Route conventions

Use readable, stable URLs. Default CRM route may redirect `/` to `/overview`. `href` on all sidebar links should be native navigable route, not JS-only toggles. Entity detail routes are linkable; a drawer can be layered using route interception or explicit client navigation when practical. Direct URL refresh must still work.

## 5. Coding conventions

- TypeScript `strict`; no implicit `any` around payment, invoice or role data.
- Zod schemas defined adjacent to feature actions for inputs; domain entities stable and reusable.
- Server-only boundaries use `server-only` where supported; no secret/import leakage into client components.
- Use dependency injection for payment/email providers; tests substitute mocks without bypassing core state logic.
- Keep presentational components small and UI-only; service functions own side effects. No database reads in icon render functions.
- Use feature-scoped tests and data-testid only for stable testing anchors, not styling.
- Database migrations versioned and reviewed; no destructive automatic schema push to production.
- Logging sanitized, structured and correlated; no console logs of private customer/payment contents.

## 6. Suggested root scripts

```json
{
  "scripts": {
    "dev": "pnpm --filter @lgndry/studio dev",
    "build": "pnpm -r build",
    "typecheck": "pnpm -r typecheck",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test",
    "test:e2e": "playwright test",
    "test:visual": "playwright test --project=visual",
    "db:migrate": "pnpm --filter @lgndry/database migrate",
    "db:seed:demo": "pnpm --filter @lgndry/database seed:demo"
  }
}
```

These are **example** scripts; Claude must make them real and working in its generated repository before claiming success. Use actual project package names and installed tooling.

## 7. Why this structure

A single-file HTML demo is excellent for exploring the interface but unsafe as a CRM backend. This structure makes customer, payment, booking and edition facts authoritative, keeps the premium UI maintainable, allows the e-commerce frontend to connect through a stable API and avoids implementing multiple redundant CRMs. Do **not** split into microservices until scale clearly warrants it.
