import type { Metadata } from "next";
import { getStaffContext } from "@/features/auth/staff";
import { CampaignsLive } from "@/features/campaigns/components/campaigns-live";
import { fetchCampaigns, type Draft, type Subscriber } from "@/features/campaigns/db";
import { WorkspaceRoute } from "@/features/workspaces/components/workspace-route";
import { campaignsWorkspace } from "@/features/workspaces/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Campaigns" };

/**
 * Signed in as owner or studio manager: draft newsletters and the real subscriber audience. Sending does not exist yet.
 * Sign-in not configured: the original sample screen, clearly marked as demo data.
 */
export default async function CampaignsPage() {
  const context = await getStaffContext();

  if (context.status === "ok") {
    const role = context.staff.role;
    if (role !== "owner" && role !== "studio_manager") {
      return (
        <div className="cat-page">
          <div className="cat-empty-box" role="status">Campaigns are available to the studio owner and studio managers.</div>
        </div>
      );
    }
    const supabase = await createSupabaseServerClient();
    let data: { drafts: Draft[]; subscribers: Subscriber[] } | null = null;
    let problem = "";
    if (supabase) {
      try {
        data = await fetchCampaigns(supabase, context.staff.workspaceId);
      } catch (error) {
        problem = error instanceof Error ? error.message : "";
      }
    }
    if (!data) {
      return (
        <div className="cat-page">
          <div className="cat-empty-box" role="alert">The campaigns could not be loaded. {problem} Check that migrations 0001 to 0013 have been applied, then reload.</div>
        </div>
      );
    }
    return <CampaignsLive initialDrafts={data.drafts} subscribers={data.subscribers} workspaceId={context.staff.workspaceId} canEdit />;
  }

  return <WorkspaceRoute config={campaignsWorkspace} phase="Phase 6 (communications and intelligence)" />;
}
