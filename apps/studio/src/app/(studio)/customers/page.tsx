import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";

export const metadata: Metadata = { title: "Customers" };

export default function CustomersPage() {
  return (
    <PhasePlaceholder
      eyebrow="01 / RELATIONSHIP MANAGEMENT"
      title={
        <>
          People behind <em>the pieces.</em>
        </>
      }
      sub="Deduplicated collector and client records, with purchase and booking history, consent and a communication timeline."
      phase="Phase 3 (customers, editions, orders)"
      delivers={[
      "One identity per person, whether they buy prints, book shoots or both",
      "Segments, private notes, assigned owner and consent records",
      "Order, booking and message history on a single timeline"
    ]}
    />
  );
}
