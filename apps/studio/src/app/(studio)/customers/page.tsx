import type { Metadata } from "next";
import { CustomersLive } from "@/features/customers/components/customers-live";
import { fetchCustomers, type LiveCustomer } from "@/features/customers/db";
import { getStaffContext } from "@/features/auth/staff";
import { WorkspaceRoute } from "@/features/workspaces/components/workspace-route";
import { customersWorkspace } from "@/features/workspaces/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Customers" };

/**
 * Signed in with a staff role: the real customers (website enquirers, newsletter subscribers, people added by hand).
 * Sign-in not configured: the original sample screen, clearly marked as demo data.
 */
export default async function CustomersPage() {
  const context = await getStaffContext();

  if (context.status === "ok") {
    const supabase = await createSupabaseServerClient();
    let items: LiveCustomer[] | null = null;
    let problem = "";
    if (supabase) {
      try {
        items = await fetchCustomers(supabase, context.staff.workspaceId);
      } catch (error) {
        problem = error instanceof Error ? error.message : "";
      }
    }
    if (!items) {
      return (
        <div className="cat-page">
          <div className="cat-empty-box" role="alert">
            The customers could not be loaded. {problem} Check that migrations 0001 to 0010 have been applied, then reload.
          </div>
        </div>
      );
    }
    const canEdit = context.staff.role === "owner" || context.staff.role === "studio_manager";
    return <CustomersLive initial={items} workspaceId={context.staff.workspaceId} canEdit={canEdit} />;
  }

  return <WorkspaceRoute config={customersWorkspace} phase="Phase 3 (customers, editions, orders)" />;
}
