import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";

export const metadata: Metadata = { title: "Enquiries" };

export default function EnquiriesPage() {
  return (
    <PhasePlaceholder
      eyebrow="06 / ENQUIRY CASES"
      title={
        <>
          Listen <em>closely.</em>
        </>
      }
      sub="Structured requests with status, priority, owner and response targets."
      phase="Phase 6 (communications and intelligence)"
      delivers={[
      "Website enquiries as cases with an owner and next-action date",
      "Links to the customer, order or booking they concern",
      "Drafts that never imply a message was sent"
    ]}
    />
  );
}
