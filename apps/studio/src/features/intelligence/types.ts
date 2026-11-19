import type { IconName } from "@/components/icons";

/** A KPI cell on the Intelligence Center rail. `href` is the drill-down destination. */
export interface Kpi {
  id: string;
  label: string;
  value: string;
  icon: IconName;
  href: string;
  /** Comparison against the previous period, shown with a semantic tone. */
  delta?: { text: string; suffix: string; tone: "up" | "alert" };
  /** Neutral supporting text (for example "On track (31 / 32 orders)"). */
  note?: string;
}

/** A rule-based, explainable signal. `basis` says exactly which rule produced it. */
export interface Signal {
  id: string;
  icon: IconName;
  title: string;
  detail: string;
  href: string;
  basis: string;
}

export interface SalesPoint {
  label: string;
  revenueCents: number;
  orders: number;
}

export interface Shoot {
  title: string;
  client: string;
  /** ISO date (YYYY-MM-DD) in Africa/Johannesburg. */
  date: string;
  status: "confirmed" | "tentative";
}

export interface TopEdition {
  name: string;
  edition: string;
  sold: number;
}

export interface FeaturedWork {
  name: string;
  edition: string;
  remaining: number;
  total: number;
  art: string;
  artAlt: string;
}

export interface IntelligenceSnapshot {
  /** "demo" data is fictional and must be visibly marked; "live" is computed from records. */
  mode: "demo" | "live";
  generatedAt: string;
  kpis: Kpi[];
  sales: { series: SalesPoint[]; monthLabels: string[]; periodRevenueCents: number; periodDeltaPct: number };
  collectorSignals: Signal[];
  bookings: { upcoming: number; pipeline: number; pending: number; shoots: Shoot[] };
  edition: { lowEditionAlerts: number; inProduction: number; inTransit: number; delivered30d: number; top: TopEdition[] };
  featured: FeaturedWork[];
  insights: Signal[];
  notes: { growth: string; opportunity: string; nextFocus: string };
  navCounts: Record<string, number>;
}

export type SnapshotResult =
  | { status: "ok"; snapshot: IntelligenceSnapshot }
  | { status: "unavailable"; reason: string };
