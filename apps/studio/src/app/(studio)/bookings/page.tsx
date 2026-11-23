import type { Metadata } from "next";
import { getStaffContext } from "@/features/auth/staff";
import { fetchBookings, fetchPickers, type LiveBooking, type PickCustomer } from "@/features/bookings/db";
import { LiveWorkspace } from "@/features/workspaces/components/live-workspace";
import { WorkspaceRoute } from "@/features/workspaces/components/workspace-route";
import { bookingsWorkspace } from "@/features/workspaces/demo-data";
import { bookingsConfig } from "@/features/workspaces/live";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Bookings" };

/**
 * The designed Bookings screen. Signed in with a staff role: the real photography bookings fill it in. Sign-in not
 * configured: the original sample screen, clearly marked as demo data.
 */
export default async function BookingsPage() {
  const context = await getStaffContext();
  if (context.status !== "ok") return <WorkspaceRoute config={bookingsWorkspace} phase="Phase 5 (photography bookings)" />;

  const { role, workspaceId } = context.staff;
  if (role === "analyst") {
    return <div className="cat-page"><div className="cat-empty-box" role="status">Bookings are available to the studio owner, studio managers, finance and assigned photographers.</div></div>;
  }

  const canEdit = role === "owner" || role === "studio_manager";
  const supabase = await createSupabaseServerClient();
  let bookings: LiveBooking[] | null = null;
  let people: PickCustomer[] = [];
  let problem = "";
  if (supabase) {
    try {
      bookings = await fetchBookings(supabase, workspaceId);
      if (canEdit) people = (await fetchPickers(supabase, workspaceId)).customers;
    } catch (error) {
      problem = error instanceof Error ? error.message : "";
    }
  }
  if (!bookings) {
    return <div className="cat-page"><div className="cat-empty-box" role="alert">The bookings could not be loaded. {problem} Check that migrations 0001 to 0013 have been applied, then reload.</div></div>;
  }
  return <LiveWorkspace kind="bookings" config={bookingsConfig(bookings)} workspaceId={workspaceId} canEdit={canEdit} bookings={bookings} people={people} />;
}
