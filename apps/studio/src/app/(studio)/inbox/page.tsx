import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";

export const metadata: Metadata = { title: "Inbox" };

export default function InboxPage() {
  return (
    <PhasePlaceholder
      eyebrow="07 / INBOX"
      title={
        <>
          One thread, <em>every voice.</em>
        </>
      }
      sub="A unified, threaded message workspace linked to customers, orders and bookings."
      phase="Phase 6 (communications and intelligence)"
      delivers={[
      "Verified transactional outbound email first",
      "Inbound sync only once a provider is configured, with honest connection status",
      "No fake mail sync"
    ]}
    />
  );
}
