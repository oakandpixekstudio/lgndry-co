# E-commerce Storefront & Studio Desk

**Technical development brief**

A connected platform for presenting, selling and managing Legendary Content’s photographic artworks, editions, collectors and orders.

**Prepared for:** Technical Developer  
**Business:** Legendary Content / LGNDRY.Co  
**Purpose:** Define the intended production build, workflows, technical safeguards and decisions to confirm before implementation.

**CONFIDENTIAL / DEVELOPMENT DISCUSSION DOCUMENT**

---

## 1. Project overview

The project is to turn two existing HTML concepts into a functioning, secure and maintainable platform. The public website will present and sell photographic artworks. The internal Studio Desk will provide the administration and customer-management tools needed to operate the print business.

- **Public storefront:** editorial website, artwork discovery, collection pages, product detail pages, cart, checkout, customer notifications and order confirmation.
- **Studio Desk:** authenticated internal dashboard for artwork catalogue, edition inventory, collectors, enquiries, orders, payments, production and fulfilment.
- **Shared backend:** one central database and application layer. Both interfaces must use the same authoritative records.
- **Future-ready:** build the print operation first, while allowing additional Legendary Content services or modules to be added later.

### Important implementation principle

The supplied HTML files are design/prototype references, not production systems. The storefront contains demonstration checkout behaviour; the Studio Desk source describes sample records and local browser saving. Build the real application behind the approved experience. Do not publish the prototypes as if they were live commerce.

## 2. Existing concepts supplied

**LGNDRY.Co storefront concept:** restrained paper/ink palette, oversized typography, staggered artwork presentation, collection filters, search, artwork detail view and cart/checkout concept. The source does not establish a verified live payment integration.

**LGNDRY Studio Desk concept:** dashboard navigation and views for editions/artworks, collectors/customers, orders, enquiries and campaigns, with search, detail drawers and record-creation flows. Its source code explicitly describes sample/demo records and local browser saving; payment is not verified.

**Direction:** preserve the visual language and useful interaction patterns where appropriate, but rebuild data handling, authentication, payment, inventory and workflow logic using a real backend and database.

## 3. Proposed platform structure

| Layer | Purpose | Key requirements |
| --- | --- | --- |
| Public storefront | Present and sell artworks. | Responsive pages; collection browsing; artwork details; cart; secure checkout; customer emails; availability and sold-out states. |
| Studio Desk | Operate the business internally. | Login; roles; dashboard; catalogue; editions; collector CRM; enquiries; orders; payments; production; fulfilment; reports. |
| Application/API | Apply business rules and connect interfaces. | Validation; permissions; payment webhooks; edition allocation; notifications; audit trail; integrations. |
| Database/media storage | Maintain source of truth. | Artwork records; edition register; customers; orders; payment events; production records; image assets; backups. |

### Illustrative data flow

Collector visits storefront → selects artwork → checks out → payment provider confirms payment to backend → backend records transaction and allocates an available edition number → Studio Desk displays the order → team produces, quality-checks, frames, packages and dispatches the work → collector receives status notifications. The browser must never be the authority for payment success, remaining stock or edition-number assignment.

## 4. Storefront requirements

### 4.1 Site experience

- Preserve the editorial, minimal, image-led character: generous negative space, restrained typography and clear navigation.
- Keep the fine-art print shop distinct from commissioned photography/service enquiries, while remaining part of LGNDRY.Co.
- Provide collection landing pages, filters, sorting, search, artwork detail pages and responsive mobile layouts.
- Optimise photographic assets with responsive sizes, modern formats, lazy loading and descriptive alt text.

### 4.2 Artwork detail page

- Artwork title, creator credit, year, location/context where appropriate, and artwork narrative.
- Primary artwork image plus separate framed-in-context and material/detail images.
- Print dimensions, paper/process, framing and mount specifications, finish, edition type, total edition size and availability.
- Price in ZAR, production/shipping information, certificate details and clear purchase or enquiry action.
- Accurate availability and sold-out state for limited editions; do not imply scarcity for open editions.

### 4.3 Cart and checkout

- Cart review, quantity validation, delivery address, shipping method, order summary and payment-provider checkout.
- Select a South Africa-supported payment gateway with the business (e.g. PayFast or another suitable provider); confirm fees, settlement, refunds and international payment needs.
- Verify payment server-to-server using signed webhooks or the provider's recommended method. Handle delayed, failed, duplicated and refunded events safely.
- Send transactional emails for order received, payment status, production/dispatch updates and delivery where supported.
- Do not store raw card details on LGNDRY.Co servers.

## 5. Product and collection architecture

The catalogue must be configurable. An administrator should be able to add an artwork, assign it to collections, upload images, set dimensions/specifications, choose an edition model, set a price and publish/unpublish it without a code change.

| Product group | Intended behaviour | Details to confirm |
| --- | --- | --- |
| Open Editions | No fixed edition cap. Print-on-demand or batch production; inventory based on production capacity. | Sizes, paper/framing options, price and lead times. |
| Individual Works | Standalone artwork; each work may be open or limited edition. | Which works, edition status, dimensions and final prices. |
| Photographic Series | Connected body of work; sell as complete set and, only if permitted, individual components. | Confirm whether R30k–R50k is per set or per artwork; define set/component edition rules. |
| Collector's Editions | Five named artworks, each with its own edition limit and premium presentation. | Confirm final limits, existing allocations, prices and certificate/framing details. |

### Indicative pricing discussed

Planning figures only, not approved prices or a market valuation: Open Editions approximately R2,500–R7,500; Individual Works approximately R8,000–R15,000; Photographic Series approximately R30,000–R50,000; Collector's Editions approximately R55,000 upwards, potentially R120,000–R150,000+ for selected works. Prices must be editable by an authorised administrator.

## 6. Collector's Editions — initial catalogue

These are the five artworks identified for this category. Treat edition figures as working information; obtain written confirmation before entering them as live inventory.

| Artwork | Working limit | Register note / confirmation |
| --- | --- | --- |
| Modishi wa Lebowa | 3 total | Two previous allocations were mentioned and one remains. Confirm whether prior allocations were sold, gifted, reserved or otherwise transferred, and record edition numbers. |
| Mashole | 6 total | Confirm existing sold, gifted, reserved or produced copies. |
| Yellow Bone | 5 total | Confirm existing allocations and final register. |
| Vuma / Bo Mma | Not finalised | Edition limit must be confirmed before publishing availability. |
| Mama Tagal (landscape) | 7 total | Confirm title spelling and existing allocations. |

**Critical:** the admin must allow an edition limit to be set and locked once sales begin. Any change to a published limit requires elevated permission, a reason and an audit record. Never silently increase an edition after it has been offered as limited.

## 7. Edition register and inventory controls

- Create one authoritative edition register per artwork. Every physical copy has a unique record and, where applicable, a number such as 02/06.
- Track statuses separately: available, temporarily reserved, payment pending, sold/paid, gifted, artist proof (AP), damaged, replacement, cancelled/refunded and retired.
- Define when a reservation begins, its expiry and what happens if payment is not completed.
- Allocate an edition number only after the agreed payment/approval condition. Allocation must be atomic so simultaneous purchases cannot receive the same final copy.
- For sets and series, prevent overselling across complete-set and individual-work sales. Represent component editions committed to a set.
- Keep a history of who changed an edition status, what changed, when and why. Do not delete historical allocations.
- Allow manual recording of historical sales, gifts and other allocations with date, recipient/owner, edition number, evidence/reference and notes.

## 8. Studio Desk — functional modules

| Module | Minimum production functionality |
| --- | --- |
| Overview | Orders, revenue/payment status, available editions, near-sold-out works, open enquiries and production tasks. |
| Artworks & Collections | Create/edit artworks; collection membership; images; descriptions; metadata; price; visibility; print/framing specs. |
| Editions | Edition cap; per-copy register; status controls; allocation history; artist proofs; sold-out logic; exportable register. |
| Collectors / Customers | Contact details; consent records; purchase history; artworks owned; edition numbers; enquiry/communication history; private notes with access controls. |
| Enquiries | Website enquiries; owner; status; source; message history; internal notes; response draft and follow-up date. |
| Orders | Order details; customer; items; price; payment status; shipping; edition allocation; timeline; refunds/cancellations. |
| Production & Fulfilment | Production checklist; supplier; print proof/QC; framing; certificate; packaging; dispatch; courier/tracking; delivery. |
| Campaigns / Content | Internal planning for artwork launches and collector communications. No bulk marketing without consent and compliant sending setup. |
| Reports / Insights | Sales by artwork/collection; edition sell-through; outstanding payments; turnaround; customer history; CSV export. |
| Settings & Users | Staff accounts; roles; permissions; payment/shipping settings; email templates; audit logs; backups. |

## 9. Order, payment and fulfilment workflow

| Stage | System behaviour / checkpoint |
| --- | --- |
| 1. Order placed | Create unique order reference; validate availability; record customer, price, delivery details and items. |
| 2. Payment pending | Do not mark paid based only on browser redirect or customer screenshot. |
| 3. Payment verified | Backend verifies provider event; record transaction reference, amount, currency and timestamp. |
| 4. Edition allocated | Reserve/allocate unique available copy using transaction-safe operation; block duplicate allocation. |
| 5. Production | Create task with print specification, supplier/production notes and expected completion date. |
| 6. Quality control | Record inspection result and reprint/replacement reason; preserve edition history. |
| 7. Framing & certificate | Record frame/mount finish, certificate ID, edition number and final sign-off. |
| 8. Packaging & dispatch | Record packaging checklist, courier, tracking number, dispatch date and shipping notification. |
| 9. Delivered / closed | Record delivery confirmation, close order and retain full order and edition history. |

## 10. Security, privacy and reliability

- Require secure Studio Desk login. Use role-based access (owner/admin, operations, fulfilment, read-only) with least-privilege permissions.
- Use HTTPS, secure password handling, session expiry, protection against common web vulnerabilities and rate limiting on sensitive endpoints.
- Validate price, stock, edition number, order status, permissions and payment state on the server.
- Use payment webhooks with signature verification, idempotency and event logging; prevent duplicate processing.
- Collect only customer information needed for orders and relationships. Record marketing consent separately from order-processing communications.
- Provide privacy notice, terms of sale, shipping/returns policy and cookie/analytics disclosures appropriate to the implementation and South African requirements; obtain legal review where needed.
- Back up database and media, test restoration, log administrative changes and define recovery process.
- Do not use browser localStorage as the primary database for customer, payment, order or edition records.

## 11. Non-functional requirements

- Responsive storefront and admin; key order actions usable on mobile.
- Optimise large photographic assets while preserving quality for premium art viewing.
- SEO: editable titles/meta descriptions, canonical URLs, product data where appropriate, sitemap and indexable artwork/collection pages.
- Accessibility: keyboard-accessible controls, readable contrast, semantic headings, labels and useful alt text.
- Maintainability: documented codebase, environment configuration, database migrations, staging environment and version control.
- Extensibility: new artworks, collections, product options, prices and edition models without custom code for each listing.
- Observability: error logging, payment event logs, audit trail and alerts for failed payment/webhook or order-processing events.

## 12. Suggested delivery phases

| Phase | Scope | Acceptance outcome |
| --- | --- | --- |
| 0 — Discovery | Review prototypes; confirm platform/hosting, database, gateway, email and shipping; finalise data model and edition rules. | Approved architecture, plan, cost, timeline and responsibilities. |
| 1 — Foundation | Backend, database, authentication, roles, admin shell, catalogue and media handling. | Admin securely manages real centrally stored records. |
| 2 — Storefront | Public pages, collections, artwork details, filters/search, cart and responsive layouts connected to catalogue. | Published catalogue is accurately reflected publicly. |
| 3 — Checkout & editions | Payment gateway, webhook verification, order creation, inventory reservation/allocation and email. | Test purchases work; no duplicate or oversold editions. |
| 4 — Studio operations | CRM, enquiries, orders, production/fulfilment, certificates, reporting and audit logs. | Team processes orders from purchase to delivery. |
| 5 — QA & launch | Security/performance/mobile testing, data migration, backup/restore, staff training and launch. | Signed acceptance checklist, production launch and handover. |

## 13. Acceptance criteria — before launch

- Staff can log in and access only functions permitted by their role.
- Admin can create, edit, publish, unpublish and archive artworks and assign collections.
- Storefront displays correct artwork details, price, edition type and availability from central database.
- A test purchase completes through the selected gateway and payment is independently verified by backend.
- A successful payment creates one order and allocates no more than one valid edition copy.
- Two concurrent attempts for the last copy cannot both succeed.
- Failed, cancelled, duplicated or refunded events do not create invalid sales or corrupt edition register.
- Studio Desk shows correct order, collector, payment state, edition number and fulfilment status.
- Staff can progress production, QC, framing, packaging and dispatch with audit history.
- Customer receives accurate transactional notifications; team can view tracking details.
- Database backup/restore is tested; developer provides documentation and credential handover.

## 14. Decisions and information required from LGNDRY.Co

The developer should flag these as open decisions rather than inventing values.

- Confirm final artwork titles and spellings, especially Vuma/Bo Mma and Mama Tagal.
- Confirm edition cap for Vuma / Bo Mma.
- Reconcile Modishi wa Lebowa history: confirm the two prior allocations, whether sales/gifts/reservations, and actual edition numbers.
- Confirm existing allocation counts for Mashole, Yellow Bone and Mama Tagal.
- Confirm whether Photographic Series pricing is for a complete set or each work, and whether component works may be sold separately.
- Approve final prices, print sizes, paper/process, framing options, production lead times and shipping charges.
- Choose payment gateway, courier/shipping approach, transactional email provider and hosting/platform.
- Confirm whether phase one is print operations only, with other Legendary Content services added later, or whether any service/commission workflow is required at launch.
- Provide final product images, artwork statements, certificates, terms, privacy notice and brand assets.

## 15. Developer deliverables and handover

- Technical architecture and data model documentation.
- Production-ready storefront and Studio Desk connected to the same backend.
- Source code in a repository controlled or accessible by LGNDRY.Co, with ownership and deployment instructions.
- Database schema/migrations, environment variable list and setup documentation.
- Payment gateway and email integration configuration, including webhook documentation.
- Admin user/role setup and staff operating guide.
- Test plan and evidence for payment, inventory, edition allocation, security and backup/restore tests.
- Staging and production deployment, domain/SSL configuration and monitoring/error logging.
- Post-launch bug-fix period, maintenance proposal, backup schedule and support responsibilities.

## Closing direction

The goal is not simply to make the two HTML concepts look finished. The goal is to create a dependable commerce and operations system that protects the integrity of the photographic editions, gives collectors a confident buying experience and gives Legendary Content a clear view of every artwork, customer, payment and physical print from listing to delivery.

Prepared as a development brief for discussion and technical estimation. Final scope, pricing, platform choices and launch criteria should be agreed in writing before development begins.
