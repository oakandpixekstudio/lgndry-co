import type { Metadata } from "next";
import { getStaffContext } from "@/features/auth/staff";
import { fetchEnquiries, type LiveEnquiry } from "@/features/enquiries/db";
import { LiveWorkspace } from "@/features/workspaces/components/live-workspace";
import { WorkspaceRoute } from "@/features/workspaces/components/workspace-route";
import { enquiriesWorkspace } from "@/features/workspaces/demo-data";
import { enquiriesConfig } from "@/features/workspaces/live";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Enquiries" };

/**
 * The designed Enquiries screen. Signed in with a staff role: the real website enquiries fill it in. Sign-in not
 * configured: the original sample screen, clearly marked as demo data.
 */
export default async function EnquiriesPage() {
  const context = await getStaffContext();
  if (context.status !== "ok") return <WorkspaceRoute config={enquiriesWorkspace} phase="Phase 6 (communications and intelligence)" />;

  const { role, workspaceId } = context.staff;
  if (role !== "owner" && role !== "studio_manager" && role !== "finance") {
    return <div className="cat-page"><div className="cat-empty-box" role="status">Enquiries are available to the studio owner, studio managers and finance.</div></div>;
  }

  const supabase = await createSupabaseServerClient();
  let enquiries: LiveEnquiry[] | null = null;
  let problem = "";
  if (supabase) {
    try {
      enquiries = await fetchEnquiries(supabase, workspaceId);
    } catch (error) {
      problem = error instanceof Error ? error.message : "";
    }
  }
  if (!enquiries) {
    return <div className="cat-page"><div className="cat-empty-box" role="alert">The enquiries could not be loaded. {problem} Check that migrations 0001 to 0013 have been applied, then reload.</div></div>;
  }
  return <LiveWorkspace kind="enquiries" config={enquiriesConfig(enquiries)} workspaceId={workspaceId} canEdit={role !== "finance"} enquiries={enquiries} />;
}
