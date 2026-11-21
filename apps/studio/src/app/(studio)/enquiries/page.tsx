import type { Metadata } from "next";
import { EnquiriesLive } from "@/features/enquiries/components/enquiries-live";
import { fetchEnquiries, type LiveEnquiry } from "@/features/enquiries/db";
import { getStaffContext } from "@/features/auth/staff";
import { WorkspaceRoute } from "@/features/workspaces/components/workspace-route";
import { enquiriesWorkspace } from "@/features/workspaces/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Enquiries" };

/**
 * Signed in with a staff role: the real enquiries from the website forms.
 * Sign-in not configured: the original sample screen, clearly marked as demo data.
 */
export default async function EnquiriesPage() {
  const context = await getStaffContext();

  if (context.status === "ok") {
    const supabase = await createSupabaseServerClient();
    let items: LiveEnquiry[] | null = null;
    let problem = "";
    if (supabase) {
      try {
        items = await fetchEnquiries(supabase, context.staff.workspaceId);
      } catch (error) {
        problem = error instanceof Error ? error.message : "";
      }
    }
    if (!items) {
      return (
        <div className="cat-page">
          <div className="cat-empty-box" role="alert">
            The enquiries could not be loaded. {problem} Check that migrations 0001 to 0009 have been applied, then reload.
          </div>
        </div>
      );
    }
    const canEdit = context.staff.role === "owner" || context.staff.role === "studio_manager";
    return <EnquiriesLive initial={items} workspaceId={context.staff.workspaceId} canEdit={canEdit} />;
  }

  return <WorkspaceRoute config={enquiriesWorkspace} phase="Phase 6 (communications and intelligence)" />;
}
