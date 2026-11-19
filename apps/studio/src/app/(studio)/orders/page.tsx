import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <PhasePlaceholder
      eyebrow="02 / ORDER OPERATIONS"
      title={
        <>
          Every order <em>matters.</em>
        </>
      }
      sub="From the storefront request to production, certificates and carefully managed delivery."
      phase="Phase 3 (customers, editions, orders)"
      delivers={[
      "Server-side price snapshots and stock-checked order creation",
      "Honest statuses: awaiting payment, in production, dispatched, delivered",
      "No edition number is allocated before verified payment"
    ]}
    />
  );
}
