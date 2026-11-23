import type { Metadata } from "next";
import { getStaffContext } from "@/features/auth/staff";
import { InsightsDashboard } from "@/features/insights/components/insights-dashboard";
import { fetchInsights, type InsightsData } from "@/features/insights/live";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Insights" };

/**
 * The designed Insights dashboard. Signed in as owner or studio manager: every figure is counted from the real records
 * (there are no sales yet, so the sales charts show enquiries, customers and bookings instead). Sign-in not configured:
 * the original sample dashboard, clearly marked as demo data.
 */
export default async function InsightsPage() {
  const context = await getStaffContext();
  if (context.status !== "ok") return <InsightsDashboard />;

  const { role, workspaceId } = context.staff;
  // Other roles cannot read customers, enquiries or consents, so their figures would be silently wrong.
  if (role !== "owner" && role !== "studio_manager") {
    return <div className="cat-page"><div className="cat-empty-box" role="status">Insights are available to the studio owner and studio managers.</div></div>;
  }

  const supabase = await createSupabaseServerClient();
  let data: InsightsData | null = null;
  let problem = "";
  if (supabase) {
    try {
      data = await fetchInsights(supabase, workspaceId);
    } catch (error) {
      problem = error instanceof Error ? error.message : "";
    }
  }
  if (!data) {
    return <div className="cat-page"><div className="cat-empty-box" role="alert">The insights could not be loaded. {problem} Check that migrations 0001 to 0013 have been applied, then reload.</div></div>;
  }
  return <InsightsDashboard live={data} />;
}
