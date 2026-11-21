# 17. Owner decisions needed before real orders

**Purpose:** the questions only the owner can answer. Until they are answered, the website keeps taking enquiries only, and checkout stays a walkthrough. Nothing here is guessed or assumed in the software.

**How to use this:** write your answer in the "Your answer" column (or just reply in the chat with the question number). Anything marked **Suggestion** is a starting point, not advice. Tax, legal and refund questions should be confirmed with your accountant or a legal adviser.

Last updated: 2026-11-22. Related: `docs/12_DECISIONS_AND_ASSUMPTIONS.md` (the engineering log).

---

## A. Blocks taking real orders (answer these first)

| # | Question | Why it matters | Suggestion / options | Your answer |
|---|---|---|---|---|
| A1 | **What is the exact legal trading entity?** Registered name, registration number, physical address, invoice contact email and phone. | Printed on every invoice and the terms of sale. The system leaves this blank rather than inventing it. | Copy it from your company registration documents (CIPC) or sole-proprietor details. | |
| A2 | **Are you VAT registered?** If yes: VAT number, and are the prices you enter **including** or **excluding** VAT? | Decides whether invoices are tax invoices and how totals are calculated. Wrong VAT on an invoice is a compliance problem, so the software will not issue tax invoices until this is confirmed. | If unsure, ask your accountant. The CRM stores prices exactly as you type them. | |
| A3 | **Which payment provider?** | Orders can only be marked paid after a verified payment from the provider. The code is built to take any hosted provider, but cannot go live without one. | Compare South African options that offer a hosted payment page, card and EFT, QR or payment links, and signed webhooks. Candidates to evaluate: Yoco, PayFast, Peach Payments, Paystack, Ozow, Stripe. **Verify each one's current features, fees and settlement terms directly; I have not assumed any.** Then open a test (sandbox) account and give me the test keys. | |
| A4 | **Refund, return and cancellation policy.** | Shown at checkout and in the terms. Public ordering stays switched off until it is approved. | Decide separately for: open editions (printed to order), limited and Collector's Editions (numbered, certified), framed items, damaged in transit. Have it checked against consumer-protection rules. | |
| A5 | **Shipping:** which areas, what prices, how long, which courier, insured? Framed works and international orders? | Checkout needs real delivery prices. The system will not guess a fee. | Start with South Africa only, a flat rate per region, unframed in a tube and framed crated, and quote anything else by enquiry. | |
| A6 | **Edition numbering: do all sizes of a work share one numbered run?** (For example, edition of 25 across A3, A2 and A1 together, or 25 of each size.) | Decides how many copies can ever be sold and what each certificate says. Cannot be changed cleanly after sales. | Current default: one shared run across sizes. | |
| A7 | **How long do you hold a copy for an unpaid order?** | Prevents two people buying the last copy, without blocking it forever. | Proposed 72 hours for limited editions. Open editions need no hold. | |

## B. Catalogue and brand content

| # | Question | Why it matters | Suggestion / options | Your answer |
|---|---|---|---|---|
| B1 | **Which works are "Buy online" and which are "Enquire first"?** | Sets the buying experience on each product page. | Open editions: buy online. Collector's Editions and series: enquire. | |
| B2 | **Are the prices and edition sizes final?** Several came from the prototype and were never approved. | Customers pay what the CRM says. | Review each work in Editions → Catalogue. | |
| B3 | **The Collector's Edition "Modishi wa Lebowa": 3 copies or 1 remaining after two earlier allocations?** | Cannot show a count until this is settled. | Settle it with the edition register before publishing. | |
| B4 | **Should the website show "N copies remaining"?** | Scarcity can help or put buyers off. Off by default. | Show it only for limited editions, and only once the register is trusted. | |
| B5 | **Can every image on the site be used commercially?** Photographers, models, locations, any third-party licences. | Publishing an image you do not hold rights to is a legal risk. | Keep a note of the rights holder for each work. | |
| B6 | **When should the real domain point at the new website?** | The old domain still serves the previous site. | After checkout is ready, or sooner if the site is enquiry-only. | |

## C. Customers and communication

| # | Question | Why it matters | Suggestion / options | Your answer |
|---|---|---|---|---|
| C1 | **Customer accounts at launch?** | Decides what to build. | Guest checkout plus an emailed order link at launch. Add optional passwordless "My orders" later. No customer passwords. | |
| C2 | **Which email service and sending address?** *(2026-11-22: the client is expected to use Resend. Waiting for their Resend API key and a verified sender address on their domain.)* (For example info@... or orders@...) Is reading incoming mail into the Inbox wanted? | Order confirmations and replies must come from a verified sender or they land in spam. | Pick a transactional email provider, verify the domain, start outbound-only. | |
| C3 | **Privacy notice and how long you keep customer data.** Marketing consent wording for the newsletter form. | South African privacy law (POPIA) needs a notice, consent records and a way to export or delete data. | Have the notice reviewed before collecting real customers. | |

## D. Studio operations and security

| # | Question | Why it matters | Suggestion / options | Your answer |
|---|---|---|---|---|
| D1 | **Who are the staff and what role does each get?** (Owner, Studio Manager, Finance, Photographer, Analyst.) | Roles control who can edit the catalogue, see customers and handle money. | Few people, least access needed. | |
| D2 | **Turn on two-step sign-in (authenticator app) for Owner and Finance?** | Required before payments go live. | Yes, for everyone with access to money or customer data. | |
| D3 | **Invoice numbering and terms:** format, payment due days, reminder schedule. | Printed on invoices and used for reminders. | For example INV-2026-0001, due in 7 days, one reminder. | |
| D4 | **Refund approval:** who can approve, and above what amount does a second person need to? | Stops mistakes and fraud on refunds. | Owner approves anything above a set amount. | |
| D5 | **Photography bookings:** service packages, quote and deposit rules, cancellation terms. | Needed before bookings can be confirmed online. | Can wait until after print sales are running. | |

---

## What each answer unlocks

- **A1, A2, A3, A4, A5:** real checkout, invoices and payments. All five are needed.
- **A6, A7, B3, B4:** published limited editions with correct numbering and stock.
- **B1, B2, B5:** more works published with confidence.
- **C1, C2, C3:** order emails and customer accounts.
- **D2:** payments cannot go live without it.

## Suggested order

1. **A3** (payment provider) first, because it has the longest lead time: account approval and sandbox setup.
2. **A1 and A2** (legal entity and VAT) with your accountant.
3. **A4 and A5** (refunds and shipping).
4. Everything else in any order.
