import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";

export const metadata: Metadata = { title: "Editions" };

export default function EditionsPage() {
  return (
    <PhasePlaceholder
      eyebrow="03 / EDITIONS & INVENTORY"
      title={
        <>
          Scarcity, <em>documented.</em>
        </>
      }
      sub="Numbered print runs, remaining copies and edition-specific fulfilment."
      phase="Phase 3 (customers, editions, orders)"
      delivers={[
      "Finite edition runs with locking once sales begin",
      "Reservations that expire, and unique numbers enforced by the database",
      "The register of every copy: owner, certificate and fulfilment history"
    ]}
    />
  );
}
