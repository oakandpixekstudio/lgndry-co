import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";

export const metadata: Metadata = { title: "Insights" };

export default function InsightsPage() {
  return (
    <PhasePlaceholder
      eyebrow="09 / BUSINESS INTELLIGENCE"
      title={
        <>
          Patterns in <em>perspective.</em>
        </>
      }
      sub="Accurate reporting with defined formulas, comparison periods and filters."
      phase="Phase 6 (communications and intelligence)"
      delivers={[
      "Metrics computed from the ledger and reconciled to the cent",
      "Explainable, rule-based signals with no undisclosed predictions",
      "Date filters, drill-downs and permissioned exports"
    ]}
    />
  );
}
