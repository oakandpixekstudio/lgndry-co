import type { Metadata } from "next";
import { BookingsPanel } from "@/features/intelligence/components/bookings-panel";
import { CommandNotes } from "@/features/intelligence/components/command-notes";
import { EditionWatch } from "@/features/intelligence/components/edition-watch";
import { IntelligenceHero } from "@/features/intelligence/components/intelligence-hero";
import { KpiRail } from "@/features/intelligence/components/kpi-rail";
import { SalesPanel } from "@/features/intelligence/components/sales-panel";
import { SignalPanel } from "@/features/intelligence/components/signal-panel";
import { getStaffContext } from "@/features/auth/staff";
import { buildLiveSnapshot } from "@/features/intelligence/queries/live-snapshot";
import { getIntelligenceSnapshot } from "@/features/intelligence/queries/get-snapshot";
import type { SnapshotResult } from "@/features/intelligence/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatLongDate } from "@/lib/format";

export const metadata: Metadata = { title: "Intelligence Center" };

/** Signed-in staff: the same designed layout, filled from the studio's own records. */
async function liveResult(workspaceId: string, role: string): Promise<SnapshotResult> {
  if (role !== "owner" && role !== "studio_manager" && role !== "finance") {
    return { status: "unavailable", reason: "The Intelligence Center is available to the studio owner, studio managers and finance." };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "unavailable", reason: "The studio is not connected to the database." };
  try {
    return { status: "ok", snapshot: await buildLiveSnapshot(supabase, workspaceId) };
  } catch (error) {
    return { status: "unavailable", reason: `The figures could not be loaded. ${error instanceof Error ? error.message : ""} Check that migrations 0001 to 0013 have been applied, then reload.` };
  }
}

export default async function OverviewPage() {
  const context = await getStaffContext();
  const result = context.status === "ok" ? await liveResult(context.staff.workspaceId, context.staff.role) : await getIntelligenceSnapshot();
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

      <CommandNotes notes={snapshot.notes} readOnly={!demo} />

      <div className="workspace-foot">
        <span>LGNDRY.Co / Studio Desk &nbsp; / &nbsp; {now.getFullYear()}</span>
        <span>{demo ? "Demo mode - fictional sample figures - no live data connection" : "Computed from live records"}</span>
      </div>
    </>
  );
}
