import type { Metadata } from "next";
import { BookingsLive } from "@/features/bookings/components/bookings-live";
import { fetchBookings, fetchPickers, type LiveBooking, type PickCustomer, type PickEnquiry } from "@/features/bookings/db";
import { getStaffContext } from "@/features/auth/staff";
import { WorkspaceRoute } from "@/features/workspaces/components/workspace-route";
import { bookingsWorkspace } from "@/features/workspaces/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Bookings" };

/**
 * Signed in with a staff role: the real photography bookings.
 * Sign-in not configured: the original sample screen, clearly marked as demo data.
 */
export default async function BookingsPage() {
  const context = await getStaffContext();

  if (context.status === "ok") {
    const supabase = await createSupabaseServerClient();
    const canEdit = context.staff.role === "owner" || context.staff.role === "studio_manager";
    let items: LiveBooking[] | null = null;
    let pickers: { customers: PickCustomer[]; enquiries: PickEnquiry[] } = { customers: [], enquiries: [] };
    let problem = "";
    if (supabase) {
      try {
        [items, pickers] = await Promise.all([
          fetchBookings(supabase, context.staff.workspaceId),
          canEdit ? fetchPickers(supabase, context.staff.workspaceId) : Promise.resolve(pickers),
        ]);
      } catch (error) {
        problem = error instanceof Error ? error.message : "";
      }
    }
    if (!items) {
      return (
        <div className="cat-page">
          <div className="cat-empty-box" role="alert">
            The bookings could not be loaded. {problem} Check that migrations 0001 to 0011 have been applied, then reload.
          </div>
        </div>
      );
    }
    return <BookingsLive initial={items} workspaceId={context.staff.workspaceId} canEdit={canEdit} customers={pickers.customers} enquiries={pickers.enquiries} />;
  }

  return <WorkspaceRoute config={bookingsWorkspace} phase="Phase 5 (photography bookings)" />;
}
