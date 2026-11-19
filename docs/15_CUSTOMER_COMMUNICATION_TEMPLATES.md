# 15 — Customer Communication and Invoice Copy Specification

**Status:** draft copy for review/brand approval, not dispatched messages.  
**Tone:** refined, concise, assured and helpful. Never imply payment, edition allocation or booking confirmation before verified events.

## 1. Sender principles

- Sender name: **LGNDRY.Co**; actual sender email must be from verified company domain.
- Use an editorial HTML template: ample white space, dark wordmark, clear hierarchy, short paragraphs, simple action buttons.
- Include invoice and order references when relevant; expose only minimum personal details.
- Dynamic values are server-escaped; never merge untrusted raw HTML.
- Support both HTML and plain-text versions. Attach invoice PDF only if generated successfully; otherwise send verified secure document link when policy permits.
- Financial and operational messages are transactional. Marketing messages require appropriate consent/opt-out processing.
- Template version and provider message ID are stored on each outbound message record.

## 2. Email: art order received and invoice issued

**Trigger:** persisted order + issued payment-request document + send job.  
**Suggested subject:** `LGNDRY.Co | We have received your order [order_ref]`

> Thank you for choosing LGNDRY.Co.
>
> We have received your order **[order_ref]** for **[artwork_title]**. Your order is awaiting payment and has not yet entered production.
>
> Your invoice **[invoice_ref]** is attached. You can pay securely by selecting **Pay invoice** below or by scanning the QR code on your invoice.
>
> **Amount due:** [formatted_total]  
> **Payment due:** [due_date]  
> **Pay invoice:** [secure_hosted_url]
>
> Once payment is verified, our studio will contact you about preparation, edition allocation and delivery.
>
> LGNDRY.Co  
> *Found Beauty in the Mundane.*

**Do not use:** “Your order has been paid” or “Your numbered edition is reserved permanently” at this stage. If real email delivery fails, show exception in CRM and retry without making a second invoice.

## 3. Email: payment confirmed

**Trigger:** signed provider webhook or authorized verified finance reconciliation, settled full amount.

**Subject:** `LGNDRY.Co | Payment confirmed for [order_ref]`

> Your payment of **[amount_paid]** for order **[order_ref]** has been confirmed.
>
> Your artwork is now entering the studio's preparation process. We will keep you informed of the expected dispatch and delivery arrangements.
>
> **Artwork:** [artwork_title]  
> **Edition:** [number/total, if allocated]  
> **Reference:** [order_ref]
>
> Thank you for collecting with LGNDRY.Co.

**Only show an edition number if allocation transaction succeeded.** If payment verified but allocation is blocked due to stock exception, use a separate human-reviewed message.

## 4. Email: photography booking request received

**Trigger:** created booking request, before quotation or deposit.

**Subject:** `LGNDRY.Co | We have received your photography enquiry [booking_ref]`

> Thank you for your interest in working with LGNDRY.Co.
>
> We have received your photography request **[booking_ref]** for **[service_type]**. Our studio will review the brief and preferred dates and contact you with the next steps.
>
> **Requested date:** [preferred_date]  
> **Location:** [location, if provided]
>
> This acknowledgement is not yet a confirmed booking.
>
> LGNDRY.Co Studio

## 5. Email: quotation and deposit

**Trigger:** approved quote and issued deposit payment request.

**Subject:** `LGNDRY.Co | Your photography quotation [quote_ref]`

> We have prepared a quotation for your **[service_type]** session.
>
> **Quotation:** [quote_ref]  
> **Proposed date:** [date, tentative]  
> **Total:** [total]  
> **Deposit required:** [deposit]  
> **Quote valid until:** [valid_until]
>
> Please review the attached scope and terms. Once you accept the quotation and we verify the deposit, we will confirm your session subject to final availability.
>
> **Review quotation:** [secure_quote_link]  
> **Pay deposit invoice:** [secure_hosted_url]

## 6. Email: shoot confirmed

**Trigger:** verified required deposit + approved quote + resource-safe calendar confirmation.

**Subject:** `LGNDRY.Co | Your photography session is confirmed [booking_ref]`

> Your photography session is confirmed.
>
> **Date & time:** [date/time and timezone]  
> **Location:** [location]  
> **Project:** [service_type]  
> **Contact:** [studio_contact]
>
> We will share any final preparation notes before the session. Please contact the studio if any details need to change.

## 7. Email: invoice reminder

**Trigger:** approved reminder schedule for outstanding payable balance. Stop reminders immediately on verified settlement, void or cancellation.

**Subject:** `LGNDRY.Co | Invoice [invoice_ref] — payment reminder`

> This is a reminder that **[balance_due]** remains outstanding on invoice **[invoice_ref]**.
>
> **Due date:** [due_date]  
> **Pay invoice securely:** [secure_hosted_url]
>
> If you have already made payment, please disregard this reminder while our studio verifies the transaction or contact us using the details on your invoice.

## 8. Invoice print layout fields

1. LGNDRY wordmark and legal issuer identity (configured/approved).
2. Document title appropriate to legal/tax status, unique invoice serial, issue/due dates.
3. Customer details needed for a compliant document.
4. Item table (artwork/variant/edition **or** booked photography service), quantity, price, tax rate/amount where applicable.
5. Subtotal, discounts, VAT treatment, shipping, total, amount paid and balance due.
6. **QR code** containing only payment-redirect URL; optional scannable pay reference visually adjacent.
7. Clickable `Pay invoice` link for mobile/PDF readers; invoice-specific secure payment token.
8. Payment terms, studio contact, cancellation/refund and invoice validity context.
9. Optional certificate/edition details should not be fabricated for unpaid orders.

**Layout guidance:** A4 invoice PDF, predominantly ivory/white and black, sharp thin rules, airy typography, restrained editorial footer. QR minimum print size and quiet zone must be tested in actual printed output; do not sacrifice scannability for aesthetics.

## 9. Failure copy

- Payment session expired: `This payment link has expired. Contact the studio or request a new secure link.`
- Payment processing pending: `We are verifying your payment. Your order status will update once confirmation is received.`
- Sold-out edition: `This edition is currently unavailable. Our studio can assist with alternatives.`
- Booking not confirmed: `Your request has been received. A session is confirmed only after the studio accepts the date and required deposit is verified.`
- Email delivery issue (staff): `We could not send this message. The draft and record were saved; retry is available.`

## 10. Template acceptance checklist

- [ ] Copy reviewed by LGNDRY owner/brand lead.
- [ ] All event triggers correspond to genuine transaction state.
- [ ] Placeholder variables typechecked and escaped.
- [ ] Invoices include correct approved legal/tax configuration.
- [ ] Scannable QR and clickable payment URL resolve to same invoice.
- [ ] Sending logs provider accepted state; no false delivered status.
- [ ] HTML + plain text preview tested across common clients/mobile.
