import type { Metadata } from "next";
import { getStaffContext } from "@/features/auth/staff";
import { fetchAttention, type Attention, type AttentionKind } from "@/features/notifications/attention";
import { NotificationsPage, type Notice, type NotificationsBinding } from "@/features/notifications/components/notifications-page";
import { dayLabel } from "@/features/workspaces/live";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Notifications" };

const CATEGORY: Record<AttentionKind, string> = { enquiry: "Enquiries", booking: "Bookings", shoot: "Bookings" };
const ICON: Record<AttentionKind, Notice["icon"]> = { enquiry: "mail", booking: "calendar", shoot: "camera" };
const KIND_LABEL: Record<AttentionKind, string> = { enquiry: "Enquiry", booking: "Booking request", shoot: "Upcoming shoot" };

/** What is really waiting, in the shape of the designed notification centre. */
function bindingFor(attention: Attention): NotificationsBinding {
  const today = dayLabel(new Date().toISOString());
  return {
    notices: attention.items.map((item) => ({
      id: item.id, title: item.title, body: item.body, time: item.when, category: CATEGORY[item.kind], icon: ICON[item.kind], href: item.href, unread: true, ref: KIND_LABEL[item.kind],
    })),
    summary: [
      ["Unread", String(attention.total), "Requires review"],
      ["Today", String(attention.items.filter((item) => item.kind !== "shoot" && dayLabel(item.at) === today).length), "Arrived today"],
      ["Orders & bookings", String(attention.counts.bookings + attention.counts.shoots), "Booking requests and shoots"],
      ["Customer signals", String(attention.counts.enquiries), "New enquiries waiting"],
    ],
  };
}

/** The designed notification centre. Signed in: what is really waiting for attention. Otherwise the sample screen, marked as demo. */
export default async function Page() {
  const context = await getStaffContext();
  if (context.status !== "ok") return <NotificationsPage />;

  const { role, workspaceId } = context.staff;
  if (role !== "owner" && role !== "studio_manager") {
    return <div className="cat-page"><div className="cat-empty-box" role="status">Notifications are available to the studio owner and studio managers.</div></div>;
  }

  const supabase = await createSupabaseServerClient();
  let attention: Attention | null = null;
  let problem = "";
  if (supabase) {
    try {
      attention = await fetchAttention(supabase, workspaceId);
    } catch (error) {
      problem = error instanceof Error ? error.message : "";
    }
  }
  if (!attention) {
    return <div className="cat-page"><div className="cat-empty-box" role="alert">The notifications could not be loaded. {problem} Check that migrations 0001 to 0013 have been applied, then reload.</div></div>;
  }
  return <NotificationsPage live={bindingFor(attention)} />;
}
