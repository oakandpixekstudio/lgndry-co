import type { Metadata } from "next";
import { getStaffContext } from "@/features/auth/staff";
import { fetchAttention, type Attention } from "@/features/notifications/attention";
import { NotificationsLive } from "@/features/notifications/components/notifications-live";
import { NotificationsPage } from "@/features/notifications/components/notifications-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Notifications" };

/** Signed in: what is really waiting for attention. Otherwise the original sample screen, marked as demo. */
export default async function Page() {
  const context = await getStaffContext();
  if (context.status !== "ok") return <NotificationsPage />;

  const role = context.staff.role;
  if (role !== "owner" && role !== "studio_manager") {
    return (
      <div className="cat-page">
        <div className="cat-empty-box" role="status">Notifications are available to the studio owner and studio managers.</div>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  let attention: Attention | null = null;
  let problem = "";
  if (supabase) {
    try {
      attention = await fetchAttention(supabase, context.staff.workspaceId);
    } catch (error) {
      problem = error instanceof Error ? error.message : "";
    }
  }
  if (!attention) {
    return (
      <div className="cat-page">
        <div className="cat-empty-box" role="alert">The notifications could not be loaded. {problem} Check that migrations 0001 to 0013 have been applied, then reload.</div>
      </div>
    );
  }
  return <NotificationsLive attention={attention} />;
}
