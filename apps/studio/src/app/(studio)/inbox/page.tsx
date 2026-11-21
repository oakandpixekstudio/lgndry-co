import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";
import { InboxWorkspace } from "@/features/workspaces/components/inbox-workspace";
import { isDemoMode } from "@/lib/demo-mode";

export const metadata: Metadata = { title: "Inbox" };

export default function InboxPage() {
  if (isDemoMode()) return <InboxWorkspace />;
  return <PhasePlaceholder eyebrow="Inbox" title={<>Inbox. <em>Studio communication, in one place.</em></>} sub="Inbound and outbound communication appears only after an authenticated provider is connected." phase="Phase 6 (communications and intelligence)" delivers={["Verified provider connection", "Permission-filtered threads", "Audited drafts and delivery states"]} />;
}
