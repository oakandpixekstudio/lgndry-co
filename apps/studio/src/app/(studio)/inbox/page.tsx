import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";
import { getStaffContext } from "@/features/auth/staff";
import { InboxLive } from "@/features/inbox/components/inbox-live";
import { fetchInbox, type PickPerson, type Thread } from "@/features/inbox/db";
import { InboxWorkspace } from "@/features/workspaces/components/inbox-workspace";
import { isDemoMode } from "@/lib/demo-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inbox" };

/**
 * Signed in as owner or studio manager: the real conversations (website form messages plus recorded entries).
 * Other roles do not see customer messages. Demo mode keeps the sample screen.
 */
export default async function InboxPage() {
  const context = await getStaffContext();

  if (context.status === "ok") {
    const role = context.staff.role;
    if (role !== "owner" && role !== "studio_manager") {
      return (
        <div className="cat-page">
          <div className="cat-empty-box" role="status">The Inbox is available to the studio owner and studio managers.</div>
        </div>
      );
    }
    const supabase = await createSupabaseServerClient();
    let data: { threads: Thread[]; people: PickPerson[] } | null = null;
    let problem = "";
    if (supabase) {
      try {
        data = await fetchInbox(supabase, context.staff.workspaceId);
      } catch (error) {
        problem = error instanceof Error ? error.message : "";
      }
    }
    if (!data) {
      return (
        <div className="cat-page">
          <div className="cat-empty-box" role="alert">The inbox could not be loaded. {problem} Check that migrations 0001 to 0012 have been applied, then reload.</div>
        </div>
      );
    }
    return <InboxLive initial={data.threads} people={data.people} workspaceId={context.staff.workspaceId} />;
  }

  if (isDemoMode()) return <InboxWorkspace />;
  return <PhasePlaceholder eyebrow="Inbox" title={<>Inbox. <em>Studio communication, in one place.</em></>} sub="Sign in to see your conversations." phase="Phase 6 (communications and intelligence)" delivers={["Verified provider connection", "Permission-filtered threads", "Audited drafts and delivery states"]} />;
}
