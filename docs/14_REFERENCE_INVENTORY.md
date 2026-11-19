# 14 — Reference Inventory, Current Prototype Audit and Traceability

## 1. Handoff assets and roles

| File | Type | How Claude must use it |
|---|---|---|
| `../references/lgndry-studio-crm-floating.html` | **Actual earlier CRM HTML** | Functional starting point. Inspect CSS, generated sections, local state, navigation, search, forms, drawers and interactions. Reuse patterns in React. Keep reference unchanged. |
| `../references/LGNDRY-Intelligence-Center-target.png` | **Latest attached user screenshot** (1672×941) | Highest-priority **visual design** target, including floating sidebar, seven KPIs, Bookings/Invoices/Inbox, chart and panels. |
| `../references/lgndry-editorial-storefront-optional.html` | Earlier website prototype (optional) | Brand continuity and later public order API integration; do **not** replace CRM with storefront. |
| `../00_CLAUDE_BUILD_PROMPT.md` | Build instruction | Copy into Claude first. It requires actual implementation, not a design exercise. |
| `01_PRODUCT_REQUIREMENTS.md` | Business functional contract | Required user journeys and priorities |
| `02_TECHNICAL_REQUIREMENTS.md` | Architecture contract | Stack/boundaries/transactions/integrations |
| `03_APPLICATION_WORKFLOWS.md` | Navigation and state machines | End-to-end domain transitions |
| `04_SECURITY_AND_ACCESS.md` | Roles/privacy/security | Non-negotiable authority and risk controls |
| `05_BRAND_AND_DESIGN_SYSTEM.md` | UI style | Visual parity, tokens and responsive behaviour |
| `06_DATA_MODEL.md` | Relational schema | Entities, constraints, money and RLS plan |
| `07_API_AND_INTEGRATIONS.md` | API/provider interfaces | Website/CRM/email/payment contracts |
| `08_ANALYTICS_AND_KPIS.md` | Metric definitions | Dashboard truthfulness, signals and drilldowns |
| `09_PROJECT_STRUCTURE.md` | Repository architecture | Code boundaries and migration mapping |
| `10_QA_AND_ACCEPTANCE.md` | Test plan | Demonstrable done/not-done |
| `11_IMPLEMENTATION_ROADMAP.md` | Build sequence | Incremental delivery and gates |
| `12_DECISIONS_AND_ASSUMPTIONS.md` | Decision log | Unknown provider/legal/business details, approved defaults |
| `13_OPERATIONS_AND_DEPLOYMENT.md` | Release/runbook | What must exist before live operations |

## 2. Findings from the actual HTML source

Inspected `lgndry-studio-crm-floating.html`, an ~85 KB standalone HTML/CSS/JavaScript file. Its `<title>` is `LGNDRY.CO / STUDIO DESK - FLOATING NAVIGATION`; theme is paper `#f5f5f2` and near-black sidebar `#141413`. It contains **seven main navigation modules** in its render code: Overview, Customers, Orders, Editions, Enquiries, Campaigns, Insights; Settings appears in a separate admin section.

The HTML includes:

- Desktop/mobile floating sidebar treatment via CSS overrides and mobile overlay.
- `overview()` title `A clearer picture.` with illustrative gross sales/orders/collectors/open enquiry KPIs.
- Sample collector records, orders, edition artworks, enquiries and campaign drafts.
- Creation forms for customers, orders, editions and campaigns; detail drawers, filtering and global search with Ctrl/Cmd+K.
- An order status update demo that may allocate a number when status changes, **without real bank settlement**; it must be replaced with a safe verified-payment domain transaction.
- Local persistence via `localStorage.getItem('lgndry-studio-crm-v1')`, **not** a shared backend or authentic records.
- No real payment gateway, invoice PDF, QR payment, booking engine, Inbox sync, production auth or reliable transaction store.

**Source-to-target gap:** `Bookings`, `Invoices`, `Inbox` and the latest multi-panel **Intelligence Center** are shown/required by the screenshot and conversation but **do not exist as functioning legacy HTML modules**. Implement them from requirements; do not pretend extraction from HTML will magically supply the backend.

## 3. What the supplied screenshot shows

- Wordmark and floating dark nav with all ten main entries plus Settings.
- `The Intelligence Center.` bold/italic masthead and grayscale editorial image.
- KPIs: Revenue R184,260; Orders 32; New Collectors 19; Booking Requests 08; Fulfilment Health 98%; Repeat Clients 41%; Open Enquiries 03 (all illustrative).
- Sales Intelligence revenue/order momentum; Collector Intelligence signals; Photography Bookings calendar/pipeline with upcoming shoots.
- Edition Watch & Fulfilment list, top-selling editions, artwork thumbnails, Studio Insights and a Key Takeaways footer.
- Search shortcut, date label, Demo Data indicator and Live Website link.

These are visual **layout requirements**, not verified business facts, live data, existing database fields or already-implemented features.

## 4. Traceability matrix

| User request | Primary document(s) | Acceptance proof |
|---|---|---|
| Build **from existing HTML** | Prompt, Reference Inventory, Structure | migration map and preserved behaviours |
| **Match screenshot** | Design System, QA | browser screenshots at target size |
| Floating sidebar | Design System | sidebar/mobile navigation screenshot |
| Intelligent dashboard | PRD, Analytics | real KPI queries and drilldowns |
| Photo bookings | PRD, Flows, Data Model | request -> quote -> deposit -> confirmed shoot |
| Invoices | PRD, Data Model, API | PDF + ledger + authorized issue |
| QR payments | Flows, API, Security | verified invoice-specific hosted link and QR scan |
| Inbox | PRD, API, Security | linked messages, true send/sync states |
| Security/Access | Security, TRD, QA | role/RLS and negative tests |
| Brand MD spec | Design System | tokens and visual QA |
| Recommended file structure | Project Structure, Prompt | generated matching repository |
| Build prompt first | `00_CLAUDE_BUILD_PROMPT.md` | present as first artifact/link |

## 5. Content provenance and caveats

- Original HTML and screenshot were generated in the user's conversation and remain included in this pack as exact file copies.
- All demo customers, numbers, artworks, prices, order references and calendar events are **illustrative**; no live business records have been imported or independently verified.
- The technical stack, detailed schema, policies and operational targets are implementation **recommendations**, not facts extracted from the screenshot.
- South African legal matters (POPIA, ECTA, SARS invoicing) are included as **review and configuration** requirements, not legal certification.
- Any implementation decision that changes a product requirement must be logged in `12_DECISIONS_AND_ASSUMPTIONS.md` and have matching tests.
