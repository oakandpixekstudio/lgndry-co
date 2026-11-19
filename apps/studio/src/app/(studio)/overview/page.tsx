import type { Metadata } from "next";
import { BookingsPanel } from "@/features/intelligence/components/bookings-panel";
import { CommandNotes } from "@/features/intelligence/components/command-notes";
import { EditionWatch } from "@/features/intelligence/components/edition-watch";
import { IntelligenceHero } from "@/features/intelligence/components/intelligence-hero";
import { KpiRail } from "@/features/intelligence/components/kpi-rail";
import { SalesPanel } from "@/features/intelligence/components/sales-panel";
import { SignalPanel } from "@/features/intelligence/components/signal-panel";
import { getIntelligenceSnapshot } from "@/features/intelligence/queries/get-snapshot";
import { formatLongDate } from "@/lib/format";

export const metadata: Metadata = { title: "Intelligence Center" };

export default async function OverviewPage() {
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
