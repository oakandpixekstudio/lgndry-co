import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";
import { getStaffContext } from "@/features/auth/staff";
import { fetchInbox, type Thread } from "@/features/inbox/db";
import { InboxWorkspace } from "@/features/workspaces/components/inbox-workspace";
import { LiveInbox } from "@/features/workspaces/components/live-inbox";
import { isDemoMode } from "@/lib/demo-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inbox" };

/**
 * The designed Inbox. Signed in as owner or studio manager: real website enquiries and recorded entries fill it in.
 * Other roles do not see customer messages. Demo mode keeps the sample screen.
 */
export default async function InboxPage() {
  const context = await getStaffContext();

  if (context.status === "ok") {
    const { role, workspaceId } = context.staff;
    if (role !== "owner" && role !== "studio_manager") {
      return <div className="cat-page"><div className="cat-empty-box" role="status">The Inbox is available to the studio owner and studio managers.</div></div>;
    }
    const supabase = await createSupabaseServerClient();
    let threads: Thread[] | null = null;
    let problem = "";
    if (supabase) {
      try {
        threads = (await fetchInbox(supabase, workspaceId)).threads;
      } catch (error) {
        problem = error instanceof Error ? error.message : "";
      }
    }
    if (!threads) {
      return <div className="cat-page"><div className="cat-empty-box" role="alert">The inbox could not be loaded. {problem} Check that migrations 0001 to 0013 have been applied, then reload.</div></div>;
    }
    return <LiveInbox threads={threads} workspaceId={workspaceId} />;
  }

  if (isDemoMode()) return <InboxWorkspace />;
  return <PhasePlaceholder eyebrow="Inbox" title={<>Inbox. <em>Studio communication, in one place.</em></>} sub="Sign in to see your conversations." phase="Phase 6 (communications and intelligence)" delivers={["Verified provider connection", "Permission-filtered threads", "Audited drafts and delivery states"]} />;
}
