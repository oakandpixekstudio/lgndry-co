import type { Metadata } from "next";
import { BookingsPanel } from "@/features/intelligence/components/bookings-panel";
import { CommandNotes } from "@/features/intelligence/components/command-notes";
import { EditionWatch } from "@/features/intelligence/components/edition-watch";
import { IntelligenceHero } from "@/features/intelligence/components/intelligence-hero";
import { KpiRail } from "@/features/intelligence/components/kpi-rail";
import { SalesPanel } from "@/features/intelligence/components/sales-panel";
import { SignalPanel } from "@/features/intelligence/components/signal-panel";
import { getIntelligenceSnapshot } from "@/features/intelligence/queries/get-snapshot";
import { getStaffContext } from "@/features/auth/staff";
import { fetchOverview, type OverviewData } from "@/features/overview/db";
import { OverviewLive } from "@/features/overview/overview-live";
import { formatLongDate } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Intelligence Center" };

export default async function OverviewPage() {
  const context = await getStaffContext();
  if (context.status === "ok") {
    const supabase = await createSupabaseServerClient();
    let data: OverviewData | null = null;
    let problem = "";
    if (supabase) {
      try {
        data = await fetchOverview(supabase, context.staff.workspaceId);
      } catch (error) {
        problem = error instanceof Error ? error.message : "";
      }
    }
    if (!data) {
      return (
        <div className="cat-page">
          <div className="cat-empty-box" role="alert">The overview could not be loaded. {problem} Check that migrations 0001 to 0010 have been applied, then reload.</div>
        </div>
      );
    }
    const role = context.staff.role;
    return <OverviewLive data={data} canSeeEnquiries={role === "owner" || role === "studio_manager" || role === "finance"} />;
  }

  const result = await getIntelligenceSnapshot();
  const now = new Date();

  if (result.status === "unavailable") {
    return (
      <>
        <IntelligenceHero longDate={formatLongDate(now)} demo={false} />
        <div className="phase-note" role="status">
          <div className="caps muted">Live data not connected</div>
          <h2>Nothing to report yet.</h2>
          <p>{result.reason}</p>
          <p>No figures are shown rather than showing invented ones.</p>
        </div>
      </>
    );
  }

  const { snapshot } = result;
  const demo = snapshot.mode === "demo";

  return (
    <>
      <IntelligenceHero longDate={formatLongDate(now)} demo={demo} />
      <KpiRail kpis={snapshot.kpis} />

      <div className="ic-row ic-row-1">
        <SalesPanel sales={snapshot.sales} demo={demo} />
        <SignalPanel eyebrow="Collector intelligence" title="Collector signals & opportunities" signals={snapshot.collectorSignals} sectionLabel="Collector signals" />
        <BookingsPanel bookings={snapshot.bookings} now={now} />
      </div>

      <div className="ic-row ic-row-2">
        <EditionWatch edition={snapshot.edition} featured={snapshot.featured} />
        <SignalPanel eyebrow="Insights" title="Studio intelligence" signals={snapshot.insights} sectionLabel="Studio insights" />
      </div>

      <CommandNotes notes={snapshot.notes} />

      <div className="workspace-foot">
        <span>LGNDRY.Co / Studio Desk &nbsp; / &nbsp; {now.getFullYear()}</span>
        <span>{demo ? "Demo mode - fictional sample figures - no live data connection" : "Computed from live records"}</span>
      </div>
    </>
  );
}
