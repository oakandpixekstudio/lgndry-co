# 12 — Decision Log, Assumptions and Launch Blockers

**Status:** initial handoff. Claude should append concrete engineering decisions with dates, rationale and impact. Unknown business details are intentionally explicit; never substitute guesses for signed-off billing or legal details.

## 1. Confirmed design / product direction from this conversation

| ID | Decision | Basis |
|---|---|---|
| D-001 | CRM is named LGNDRY.Co Studio Desk and uses LGNDRY's editorial identity | approved HTML and screenshot |
| D-002 | Floating left charcoal sidebar on mineral-white canvas | approved floating HTML and latest screenshot |
| D-003 | Intelligence Center is the Overview screen | latest screenshot and user request |
| D-004 | Primary nav includes Overview, Customers, Orders, Editions, Bookings, Invoices, Enquiries, Inbox, Campaigns, Insights; Settings under Admin | latest screenshot |
| D-005 | Supports both e-commerce print sales and photography bookings | user requirement |
| D-006 | Prints use **invoice-first** order flow, not mandatory immediate website checkout | user conversation |
| D-007 | Invoice includes a convenient QR to payment and email includes clickable link | user conversation |
| D-008 | CRM should be built **from the actual prior HTML** and closely match the supplied screenshot | current handoff instruction |

## 2. Proposed engineering defaults (not verified business decisions)

| ID | Proposed default | Reconsider/approve before live trade |
|---|---|---|
| A-001 | One business workspace, active staff RBAC; not public multi-tenant SaaS | after strategy change only |
| A-002 | Next.js App Router + TypeScript + Supabase Postgres/Auth/Storage | confirm infrastructure provider/security review |
| A-003 | ZAR, `en-ZA`, `Africa/Johannesburg` | confirm all locations/currencies if expanded |
| A-004 | Edition reservation validity 72h | Owner/Finance: stock and demand policy |
| A-005 | Print orders paid in full before production/number allocation | Owner/Studio Manager |
| A-006 | Bookings require approved quote and verified deposit before confirmation | Owner/Studio Manager |
| A-007 | Hosted payment gateway with server-verified webhooks; provider abstracted until selected | Finance/Engineering |
| A-008 | Transactional email via a configured provider; inbound sync phased later | Studio Manager/Engineering |
| A-009 | PDF invoice generated from immutable snapshot; QR is secure URL | Finance/Engineering |
| A-010 | Initial intelligence alerts are deterministic, not AI predictions | Owner/Engineering |
| A-011 | Public guest checkout/request is supported without login | Owner/privacy review |
| A-012 | Legal/VAT invoice wording gated until issuer tax status confirmed | Finance/legal |
| A-013 | Role list/permission matrix in Security spec is proposed baseline | Owner/technical lead |

## 3. Business-specific open questions and safe default handling

| Question | Affected feature | Safe build-time action | Launch dependency |
|---|---|---|---|
| What is the registered legal trading entity, address and invoice contact? | Invoice/PDF | configurable, placeholder in dev only | **Yes** |
| Is LGNDRY VAT registered? Which VAT number and treatment? | Tax invoice | no assumed VAT; tax config disabled pending approval | **Yes** |
| Which provider handles SA hosted checkout, payment links and QR routing? | QR/payment | typed adapter + sandbox mock; production disabled | **Yes** |
| What is the approved refund/return/cancellation policy? | Checkout terms | policy placeholder linked in demo; public ordering gated until approved | **Yes** |
| What are shipping areas, rates, lead times and courier choices? | Order totals/fulfilment | configurable rates; no guessed live delivery fees | **Yes** |
| Which email service/domain does LGNDRY use? Is inbound API access available? | Inbox/outbound | transactional mock in dev; show not connected | Live outbound: **Yes**; inbound: P1 |
| How are edition runs defined across size/frame options? | Inventory and COA | shared run by default, explicit run ID; no invalid publication | **Yes** for published work |
| What are service packages, quote/deposit/cancellation policies? | Bookings | configurable services; quote review required | **Yes** |
| Are photographer crew/studio calendars centrally managed? | Calendar | internal resource model and no external sync until approved | Internal yes; external sync no |
| When should unpaid invoices expire/reminders fire? | Order reservation/reminders | configurable and off in production until approved | **Yes** |
| Who approves refunds and above what threshold? | Finance workflow | make-checker for elevated refund; defaults require approval | **Yes** |
| What is privacy notice/retention schedule? | Data governance | minimal data, role controls, retention placeholder and review | **Yes** |
| Which artwork photographs/brand font assets can be used commercially? | Design | existing demo placeholders; no unlicensed copies | **Yes** for final content |

## 4. Known source-to-target differences

| Feature | Legacy HTML | Screenshot / requirement | Build implication |
|---|---|---|---|
| Main headline | `A clearer picture.` | `The Intelligence Center.` | redesign overview heading / structure |
| Dashboard metrics | fixed illustrative values | dynamic KPI/intelligence | new authoritative read models |
| Main modules | Customers/Orders/Editions/Enquiries/Campaigns/Insights/Settings + Overview | adds Bookings, Invoices, Inbox | new pages, domain flows and nav items |
| Persistence | browser localStorage | real shared CRM | DB, auth, audit, migrations |
| Payments | manually changed order status in demo | invoice-first/QR/verified payments | secure backend and provider adapter |
| Edition number | demo status-change logic | allocate only after verified payment | transactional inventory allocator |
| Inbox | no integrated messages workspace | threaded Inbox | new entities and email adapter |
| Booking calendar | not present | appointment + workflow dashboard | service/crew/availability model |
| Tax/PDF | not in demo | real invoice document | immutable snapshot and configuration |

## 5. Engineering log template

Append:

```markdown
### DEC-YYYY-NNN — [Decision]
- Date:
- Owner:
- Context:
- Options considered:
- Selected choice:
- Impact on UI / schema / security / integrations:
- Tests / documents updated:
- Status: Proposed | Approved | Superseded
```

Do not treat this document as authority to invent merchant credentials, tax status or supplier legal identity. Those remain go-live gates.

## 6. Engineering decisions log

### DEC-2026-001 — Repository root is `LGNDRY-Co/`, with `apps/studio` and `apps/storefront`
- Date: 2026-11-19
- Owner: engineering (requested by the project owner)
- Context: the handoff package described `lgndry-platform/`. The client folder already holds the storefront, the handoff documents and two unrelated projects.
- Selected choice: the client folder itself is the monorepo root. `studio-desk/` became `apps/studio`, specs moved to `docs/`, references to `references/`. `apps/storefront` is the existing storefront repository (its own git history, GitHub remote and Vercel project, unchanged). **Pending:** the folder is still at `webites/lgndry-store/` because a dev server running there locks it. Stop that server, then run `mv webites/lgndry-store apps/storefront`.
- Impact: the monorepo git ignores `apps/storefront/`, `lgndrycp-site/`, `documents/` and `webites/`. `lgndrycp-site/` contains local credential files and is not part of this repository.
- Status: Approved

### DEC-2026-002 — TypeScript pinned to the 6.x line
- Context: TypeScript 7.0 installed by default, but `typescript-eslint` does not yet support it, which broke linting.
- Selected choice: `typescript@6`. Revisit when typescript-eslint supports 7.x.
- Status: Approved

### DEC-2026-003 — Studio runs on port 3100; storefront stays on 3000
- Context: both apps run locally at once.
- Status: Approved

### DEC-2026-004 — Demo mode defaults to ON
- Context: no database or provider exists yet. A default of "off" would require inventing figures or showing nothing.
- Selected choice: `DEMO_MODE` is on unless set to `false`. Outside demo mode the Intelligence Center shows an explicit "Live data not connected" state, not invented numbers.
- Status: Approved

### DEC-2026-005 — Fulfilment health computed from its own inputs
- Context: the target screenshot shows "98%" beside "31 / 32 orders", which does not agree (31/32 is 96.9%).
- Selected choice: the percentage is derived from the counts shown, so the demo displays 97%. Visual parity on this one figure is deliberately not preserved.
- Status: Approved

### DEC-2026-006 — Responsive KPI rail
- Context: seven cells fit at 1672px but not legibly at 1440px beside a 218px sidebar.
- Selected choice: 7 columns above 1500px, 4 below, 2 on phones. Text is not shrunk to illegibility.
- Status: Proposed (confirm with visual QA at 1440)

### DEC-2026-007 — Calendar status is explicit
- Context: spec requires tentative and confirmed bookings to be distinguishable and unconfirmed requests not to block dates.
- Selected choice: confirmed shoots are filled dots, tentative ones hollow, with a legend and per-day `aria-label`.
- Status: Approved

### DEC-2026-008 — Open item: edition run model
- Context: `06_DATA_MODEL.md` leaves how an edition run spans sizes and frames undecided.
- Selected choice: none yet. To be settled in Phase 3 before any artwork is published.
- Status: Proposed
