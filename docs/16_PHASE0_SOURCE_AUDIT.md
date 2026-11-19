# 16 — Phase 0 source audit and migration map

Audit of `references/lgndry-studio-crm-floating.html` (the approved prototype) against
`references/LGNDRY-Intelligence-Center-target.png` (the visual target). Written at the start of the build.

## 1. What the HTML actually contains

A single file, 87 KB, rendering eight views from in-memory sample data (`localStorage` key
`lgndry-studio-crm-v1`): Overview, Customers, Orders, Editions, Enquiries, Campaigns, Insights, Settings.
Shared behaviours: global search overlay (Ctrl/Cmd+K), right-hand record drawer, creation modals, filter
rows, local search inputs, toasts, a reset-demo action, and a responsive sidebar that becomes a drawer
under 800px. Its last revision changed only the navigation: the sidebar became a floating, rounded card
and the active item a light pill.

Logic that must **not** be carried over as authority: `updateOrder()` assigns an edition number when an
order leaves "Pending payment" in the browser; sales and KPI figures are hard-coded; all state is local.

## 2. Visual and feature deltas (target screenshot against HTML)

| Item | HTML | Target | Build decision |
|---|---|---|---|
| Overview heading | "A clearer picture." | "The Intelligence Center." | Target wins (D-003) |
| KPIs | 4 | 7 (adds booking requests, fulfilment health, repeat clients) | 7 cells; 4 columns under 1500px |
| Nav | 7 items + Settings | adds Bookings, Invoices, Inbox | Fixed order from `05_BRAND_AND_DESIGN_SYSTEM.md` |
| Panels | chart, featured edition, orders, collectors | collector signals, bookings calendar, edition watch, insights, command notes | New feature components |
| Hero image | none | cropped monochrome landscape | Labelled "Sample artwork" SVG; real licensed asset later |

## 3. Old element to new component

| HTML | React |
|---|---|
| `.sidebar`, `.nav-btn` | `components/layout/floating-sidebar.tsx` (native `<Link>`, `aria-current`) |
| `.topbar`, search overlay | `components/layout/topbar.tsx`, `components/shared/search-dialog.tsx` |
| mobile drawer | `components/layout/studio-shell.tsx` (focus, Escape, scroll lock) |
| `overview()` | `features/intelligence/*` and `app/(studio)/overview/page.tsx` |
| sample seed | `features/intelligence/queries/demo-snapshot.ts` (demo only; Phase 2 adds `packages/database/seed`) |
| icon `paths` | `components/icons.tsx` |
| CSS | `styles/{tokens,typography,shell,components,intelligence}.css` |
| other views | route shells now; real implementations in their phases |

## 4. Not yet migrated

Customers, orders, editions, enquiries, campaigns, insights and settings views; the record drawer; creation
modals; filter rows. Each moves with its phase, with server-side authority replacing `localStorage`.
