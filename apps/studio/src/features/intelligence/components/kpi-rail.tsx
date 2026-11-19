import Link from "next/link";
import { Icon } from "@/components/icons";
import type { Kpi } from "../types";

/** Seven KPI cells. Each links to the records it summarises (drill-down). */
export function KpiRail({ kpis }: { kpis: Kpi[] }) {
  return (
    <section className="kpi-rail" aria-label="Key performance indicators">
      {kpis.map((k) => (
        <Link key={k.id} href={k.href} className="kpi" aria-label={`${k.label}: ${k.value}. View records`}>
          <div className="kpi-title">
            <span>{k.label}</span>
            <Icon name={k.icon} size={14} />
          </div>
          <div className="kpi-value tabnum">{k.value}</div>
          <div className="kpi-footer">
            {k.delta ? (
              <>
                <span className={k.delta.tone === "alert" ? "kpi-alert" : "kpi-up"}>{k.delta.text}</span>
                {k.delta.suffix ? <span>{k.delta.suffix}</span> : <Icon name="arrow" size={12} />}
              </>
            ) : (
              <span>{k.note}</span>
            )}
          </div>
        </Link>
      ))}
    </section>
  );
}
