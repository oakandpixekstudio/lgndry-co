import { redirect } from "next/navigation";
import { StudioShell } from "@/components/layout/studio-shell";
import { NoAccess } from "@/features/auth/components/no-access";
import { getStaffContext } from "@/features/auth/staff";
import { fetchAttention, RESTRICTED_ATTENTION, type Attention } from "@/features/notifications/attention";
import { getIntelligenceSnapshot } from "@/features/intelligence/queries/get-snapshot";
import { formatTopbarDate } from "@/lib/format";
import { isDemoMode } from "@/lib/demo-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import "../../styles/insights-dashboard.css";
import "../../styles/settings-dashboard.css";

// Operational data: always rendered per request, never statically cached.
export const dynamic = "force-dynamic";

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://www.lgndry-co.co.za/";

/**
 * What needs attention, for the bell and the sidebar badges. If it cannot be worked out (for example a database update
 * has not been applied yet) the page must still open, so this never throws: it falls back to just the new-enquiry count.
 */
async function loadAttention(workspaceId: string | null, role: string | null): Promise<{ attention: Attention | null; newEnquiries: number | null }> {
  if (!workspaceId) return { attention: null, newEnquiries: null };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { attention: null, newEnquiries: null };
  // Only the owner and studio managers can act on these alerts, so only they pay for the three queries on every page.
  // Finance can still read enquiries, so it keeps the one-query badge. The other roles read neither, so no query runs.
  if (role !== "owner" && role !== "studio_manager") {
    if (role !== "finance") return { attention: RESTRICTED_ATTENTION, newEnquiries: null };
    const { count } = await supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new");
    return { attention: RESTRICTED_ATTENTION, newEnquiries: count ?? 0 };
  }
  try {
    const attention = await fetchAttention(supabase, workspaceId);
    return { attention, newEnquiries: attention.counts.enquiries };
  } catch {
    const { count } = await supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new");
    return { attention: null, newEnquiries: count ?? 0 };
  }
}

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  // Second line of defence after proxy.ts: signed in AND holding an active staff role.
  const context = await getStaffContext();
  if (context.status === "signed-out") redirect("/sign-in");
  if (context.status === "no-access") return <NoAccess email={context.email} />;

  const staff = context.status === "ok" ? context.staff : null;
  // The sidebar badge for Enquiries must be the real number of new enquiries, not a sample figure.
  const [result, { attention, newEnquiries }] = await Promise.all([getIntelligenceSnapshot(), loadAttention(staff?.workspaceId ?? null, staff?.role ?? null)]);
  const counts = {
    ...(result.status === "ok" ? result.snapshot.navCounts : {}),
    ...(newEnquiries === null ? {} : { "/enquiries": newEnquiries }),
    ...(attention && !attention.restricted ? { "/bookings": attention.counts.bookings } : {}),
  };

  return (
    <StudioShell
      counts={counts}
      demo={isDemoMode()}
      dateLabel={formatTopbarDate(new Date())}
      storefrontUrl={STOREFRONT_URL}
      attention={attention}
      staff={staff ? { name: staff.name, initials: staff.initials, email: staff.email, roleLabel: staff.roleLabel } : null}
    >
      {children}
    </StudioShell>
  );
}
