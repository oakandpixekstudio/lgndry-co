import { formatPercent, formatZar, johannesburgYmd, pad2 } from "@/lib/format";
import type { IntelligenceSnapshot, Shoot } from "../types";

/**
 * FICTIONAL demonstration data for the Intelligence Center (DEMO_MODE only).
 *
 * Every figure here is invented to exercise the layout. It is the stand-in for the
 * authoritative read models that Phase 6 will compute from real records, and it is
 * only ever returned while isDemoMode() is true. Dates are anchored to "today" in
 * Africa/Johannesburg so the demo calendar always looks current.
 */

function isoPlusDays(base: Date, days: number): string {
  const { year, month, day } = johannesburgYmd(base);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

export function buildDemoSnapshot(now: Date = new Date()): IntelligenceSnapshot {
  const revenueCents = 18_426_000;
  const orders = 32;
  const onTrack = 31;

  const shoots: Shoot[] = [
    { title: "Editorial / Coastline", client: "M. Sinder (demo)", date: isoPlusDays(now, 2), status: "confirmed" },
    { title: "Portrait Series", client: "A. Ohré (demo)", date: isoPlusDays(now, 6), status: "confirmed" },
    { title: "Brand Campaign", client: "Sample studio (demo)", date: isoPlusDays(now, 10), status: "tentative" },
  ];

  const revenueByPeriodThousands = [8, 11, 9, 12, 10, 14, 11, 16, 13, 15, 14, 18];
  const ordersByPeriod = [2, 3, 3, 4, 3, 4, 4, 5, 4, 5, 5, 6];
  const halfLabels = ["Jun A", "Jun B", "Jul A", "Jul B", "Aug A", "Aug B", "Sep A", "Sep B", "Oct A", "Oct B", "Nov A", "Nov B"];

  return {
    mode: "demo",
    generatedAt: now.toISOString(),
    kpis: [
      {
        id: "revenue",
        label: "Revenue (30 days)",
        value: formatZar(revenueCents),
        icon: "arrow",
        href: "/invoices",
        delta: { text: formatPercent(14.6), suffix: "vs. previous period", tone: "up" },
      },
      {
        id: "orders",
        label: "Orders",
        value: pad2(orders),
        icon: "box",
        href: "/orders",
        delta: { text: formatPercent(28, 0), suffix: "vs. previous period", tone: "up" },
      },
      {
        id: "collectors",
        label: "New collectors",
        value: pad2(19),
        icon: "users",
        href: "/customers",
        delta: { text: "+6", suffix: "vs. previous period", tone: "up" },
      },
      {
        id: "bookings",
        label: "Booking requests",
        value: pad2(8),
        icon: "calendar",
        href: "/bookings",
        delta: { text: formatPercent(33, 0), suffix: "vs. previous period", tone: "up" },
      },
      {
        id: "fulfilment",
        label: "Fulfilment health",
        value: `${Math.round((onTrack / orders) * 100)}%`,
        icon: "layers",
        href: "/orders",
        note: `On track (${onTrack} / ${orders} orders)`,
      },
      {
        id: "repeat",
        label: "Repeat clients",
        value: "41%",
        icon: "refresh",
        href: "/customers",
        delta: { text: "+7 pp", suffix: "vs. previous period", tone: "up" },
      },
      {
        id: "enquiries",
        label: "Open enquiries",
        value: pad2(3),
        icon: "mail",
        href: "/enquiries",
        delta: { text: "Needs attention", suffix: "", tone: "alert" },
      },
    ],
    sales: {
      series: revenueByPeriodThousands.map((k, i) => ({
        label: halfLabels[i] ?? "",
        revenueCents: k * 100_000,
        orders: ordersByPeriod[i] ?? 0,
      })),
      monthLabels: ["JUN", "JUL", "AUG", "SEP", "OCT", "NOV"],
      periodRevenueCents: revenueCents,
      periodDeltaPct: 14.6,
    },
    collectorSignals: [
      {
        id: "s1",
        icon: "user",
        title: "High intent collectors",
        detail: "5 collectors viewed editions 3+ times in 7 days.",
        href: "/customers",
        basis: "Rule: 3 or more edition page views within 7 days.",
      },
      {
        id: "s2",
        icon: "star",
        title: "Repeat purchase opportunity",
        detail: "12 past clients are likely to collect again.",
        href: "/customers",
        basis: "Rule: 2 or more paid orders and no order in the last 90 days.",
      },
      {
        id: "s3",
        icon: "trend",
        title: "Growing interest: Limited Editions",
        detail: "+37% edition views vs. previous 30 days.",
        href: "/editions",
        basis: "Rule: edition page views, current 30 days against previous 30 days.",
      },
    ],
    bookings: { upcoming: 3, pipeline: 12, pending: 4, shoots },
    edition: {
      lowEditionAlerts: 2,
      inProduction: 6,
      inTransit: 4,
      delivered30d: 28,
      top: [
        { name: "A Quiet Form", edition: "Edition I", sold: 8 },
        { name: "Salt & Stone", edition: "Edition II", sold: 6 },
        { name: "Desert Light", edition: "Edition I", sold: 5 },
      ],
    },
    featured: [
      {
        name: "A Quiet Form",
        edition: "Edition I",
        remaining: 8,
        total: 25,
        art: "/artwork-placeholders/dune.svg",
        artAlt: "Sample artwork: monochrome sand dune",
      },
      {
        name: "Salt & Stone",
        edition: "Edition II",
        remaining: 6,
        total: 30,
        art: "/artwork-placeholders/cliff.svg",
        artAlt: "Sample artwork: monochrome coastal cliff",
      },
    ],
    insights: [
      {
        id: "i1",
        icon: "bars",
        title: "Revenue up 14.6%",
        detail: "Driven by limited editions and repeat collectors.",
        href: "/insights",
        basis: "Rule: paid invoices in the last 30 days against the previous 30 days.",
      },
      {
        id: "i2",
        icon: "users",
        title: "Collector retention at 41%",
        detail: "+7 pp vs. previous period, with 12 high-intent collectors.",
        href: "/insights",
        basis: "Rule: share of customers with a second paid order within 12 months.",
      },
      {
        id: "i3",
        icon: "bolt",
        title: "Booking demand rising",
        detail: "+33% studio booking requests, with strong editorial interest.",
        href: "/bookings",
        basis: "Rule: booking requests received, current 30 days against previous 30 days.",
      },
    ],
    notes: {
      growth: "Commerce and bookings are both up, with strong momentum in limited editions.",
      opportunity: "Follow up with 5 high-intent collectors and convert 4 pending shoot requests.",
      nextFocus: "Monitor low-edition works (2) and keep production on track for upcoming releases.",
    },
    navCounts: { "/orders": 3, "/bookings": 2, "/enquiries": 3 },
  };
}
