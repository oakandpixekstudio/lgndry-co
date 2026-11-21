import { redirect } from "next/navigation";
import { StudioShell } from "@/components/layout/studio-shell";
import { NoAccess } from "@/features/auth/components/no-access";
import { getStaffContext } from "@/features/auth/staff";
import { getIntelligenceSnapshot } from "@/features/intelligence/queries/get-snapshot";
import { formatTopbarDate } from "@/lib/format";
import { isDemoMode } from "@/lib/demo-mode";
import "../../styles/insights-dashboard.css";
import "../../styles/settings-dashboard.css";

// Operational data: always rendered per request, never statically cached.
export const dynamic = "force-dynamic";

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://www.lgndry-co.co.za/";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  // Second line of defence after proxy.ts: signed in AND holding an active staff role.
  const context = await getStaffContext();
  if (context.status === "signed-out") redirect("/sign-in");
  if (context.status === "no-access") return <NoAccess email={context.email} />;

  const result = await getIntelligenceSnapshot();
  const counts = result.status === "ok" ? result.snapshot.navCounts : {};
  const staff = context.status === "ok" ? context.staff : null;

  return (
    <StudioShell
      counts={counts}
      demo={isDemoMode()}
      dateLabel={formatTopbarDate(new Date())}
      storefrontUrl={STOREFRONT_URL}
      staff={staff ? { name: staff.name, initials: staff.initials, email: staff.email, roleLabel: staff.roleLabel } : null}
    >
      {children}
    </StudioShell>
  );
}
