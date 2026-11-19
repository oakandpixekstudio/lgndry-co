import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";

export const metadata: Metadata = { title: "Campaigns" };

export default function CampaignsPage() {
  return (
    <PhasePlaceholder
      eyebrow="08 / AUDIENCE & CAMPAIGNS"
      title={
        <>
          A considered <em>conversation.</em>
        </>
      }
      sub="Consent-aware audience segments and collector communications."
      phase="Phase 6 (communications and intelligence)"
      delivers={[
      "Internal campaign drafts and audience preview",
      "Approval before any external send",
      "Unsubscribed or non-consenting recipients never receive marketing"
    ]}
    />
  );
}
