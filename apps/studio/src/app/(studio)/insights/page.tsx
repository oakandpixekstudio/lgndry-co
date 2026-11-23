import type { Metadata } from "next";
import { getStaffContext } from "@/features/auth/staff";
import { InsightsDashboard } from "@/features/insights/components/insights-dashboard";
import { InsightsLive } from "@/features/insights/components/insights-live";
import { fetchInsights, type InsightsData } from "@/features/insights/live";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Insights" };

/**
 * Signed in with a staff role: figures counted from the real records.
 * Sign-in not configured: the original sample dashboard, clearly marked as demo data.
 */
export default async function InsightsPage() {
  const context = await getStaffContext();

  if (context.status === "ok") {
    const role = context.staff.role;
    // Other roles cannot read customers, enquiries or consents, so their figures would be silently wrong. Better to say so.
    if (role !== "owner" && role !== "studio_manager") {
      return (
        <div className="cat-page">
          <div className="cat-empty-box" role="status">Insights are available to the studio owner and studio managers.</div>
        </div>
      );
    }
    const supabase = await createSupabaseServerClient();
    let data: InsightsData | null = null;
    let problem = "";
    if (supabase) {
      try {
        data = await fetchInsights(supabase, context.staff.workspaceId);
      } catch (error) {
        problem = error instanceof Error ? error.message : "";
      }
    }
    if (!data) {
      return (
        <div className="cat-page">
          <div className="cat-empty-box" role="alert">The insights could not be loaded. {problem} Check that migrations 0001 to 0012 have been applied, then reload.</div>
        </div>
      );
    }
    return <InsightsLive data={data} />;
  }

  return <InsightsDashboard />;
}
