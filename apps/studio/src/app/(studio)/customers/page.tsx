import type { Metadata } from "next";
import { getStaffContext } from "@/features/auth/staff";
import { fetchCustomers, type LiveCustomer } from "@/features/customers/db";
import { LiveWorkspace } from "@/features/workspaces/components/live-workspace";
import { WorkspaceRoute } from "@/features/workspaces/components/workspace-route";
import { customersWorkspace } from "@/features/workspaces/demo-data";
import { customersConfig } from "@/features/workspaces/live";
import { fetchAllRows } from "@/lib/supabase/paged";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Customers" };

/**
 * The designed Customers screen. Signed in with a staff role: the real customers fill it in. Sign-in not configured:
 * the original sample screen, clearly marked as demo data.
 */
export default async function CustomersPage() {
  const context = await getStaffContext();
  if (context.status !== "ok") return <WorkspaceRoute config={customersWorkspace} phase="Phase 3 (customers, editions, orders)" />;

  const { role, workspaceId } = context.staff;
  if (role !== "owner" && role !== "studio_manager" && role !== "finance") {
    return <div className="cat-page"><div className="cat-empty-box" role="status">Customers are available to the studio owner, studio managers and finance.</div></div>;
  }

  const supabase = await createSupabaseServerClient();
  let customers: LiveCustomer[] | null = null;
  const bookingCounts: Record<string, number> = {};
  let problem = "";
  if (supabase) {
    try {
      customers = await fetchCustomers(supabase, workspaceId);
      // How many photography bookings each customer has. If this cannot be read the counts simply show 0.
      const bookings = await fetchAllRows<{ customer_id: string }>((from, to) => supabase.from("booking_requests").select("customer_id").eq("workspace_id", workspaceId).order("id").range(from, to)).catch(() => []);
      for (const b of bookings) bookingCounts[b.customer_id] = (bookingCounts[b.customer_id] ?? 0) + 1;
    } catch (error) {
      problem = error instanceof Error ? error.message : "";
    }
  }
  if (!customers) {
    return <div className="cat-page"><div className="cat-empty-box" role="alert">The customers could not be loaded. {problem} Check that migrations 0001 to 0013 have been applied, then reload.</div></div>;
  }
  return <LiveWorkspace kind="customers" config={customersConfig(customers, bookingCounts)} workspaceId={workspaceId} canEdit={role !== "finance"} customers={customers.filter((c) => !c.archived)} bookingCounts={bookingCounts} />;
}
