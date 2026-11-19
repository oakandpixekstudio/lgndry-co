import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";

export const metadata: Metadata = { title: "Invoices" };

export default function InvoicesPage() {
  return (
    <PhasePlaceholder
      eyebrow="05 / INVOICES & PAYMENTS"
      title={
        <>
          Paid, <em>verified.</em>
        </>
      }
      sub="Invoice-first purchasing: a secure payment link and QR code per invoice, marked paid only by verified payment."
      phase="Phase 4 (invoice-first payment and documents)"
      delivers={[
      "Immutable issued invoices with unique serials and PDF download",
      "Invoice-specific payment URL and QR code (never raw bank details)",
      "Only a verified gateway webhook, or authorised reconciliation with evidence, marks an invoice paid"
    ]}
    />
  );
}
