"use client";

import { useState } from "react";
import { formatPercent, formatZar } from "@/lib/format";
import type { IntelligenceSnapshot } from "../types";

type Metric = "revenue" | "orders";

/**
 * Sales intelligence: bars show the selected metric, the line shows the other one.
 * A visually hidden table carries the same values for assistive technology.
 */
export function SalesPanel({ sales, demo }: { sales: IntelligenceSnapshot["sales"]; demo: boolean }) {
  const [metric, setMetric] = useState<Metric>("revenue");
  const [hover, setHover] = useState<number | null>(null);
  const { series } = sales;

  const barValues = series.map((s) => (metric === "revenue" ? s.revenueCents : s.orders));
  const lineValues = series.map((s) => (metric === "revenue" ? s.orders : s.revenueCents));
  const barMax = Math.max(...barValues, 1) * 1.08;
  const lineMax = Math.max(...lineValues, 1) * 1.08;
  const n = series.length;

  const fmt = (i: number) => {
    const s = series[i];
    return s ? `${s.label}: ${formatZar(s.revenueCents)} · ${s.orders} orders` : "";
  };

  const linePoints = lineValues
    .map((v, i) => `${((i + 0.5) / n) * 100},${100 - (v / lineMax) * 100}`)
    .join(" ");

  return (
    <section className="panel panel-pad" aria-labelledby="sales-title">
      <div className="panel-head">
        <div>
          <div className="caps muted">Sales intelligence</div>
          <h2 className="panel-title serif" id="sales-title">
            Revenue &amp; orders momentum
          </h2>
          <div className="chart-toggle" role="group" aria-label="Chart metric">
            <button type="button" aria-pressed={metric === "revenue"} onClick={() => setMetric("revenue")}>
              Revenue
            </button>
            <button type="button" aria-pressed={metric === "orders"} onClick={() => setMetric("orders")}>
              Orders
            </button>
          </div>
        </div>
        <div className="sales-head-figure">
          <div className="revenue-figure tabnum">{formatZar(sales.periodRevenueCents)}</div>
          <div className="caps muted" style={{ marginTop: 6, fontSize: 10.5 }}>
            30-day revenue{demo ? <> &nbsp; {formatPercent(sales.periodDeltaPct)}</> : " · no sales yet"}
          </div>
        </div>
      </div>

      <div className="sales-plot" data-reveal="bars" role="img" aria-label={`Bar chart of ${metric} across ${n} periods. A data table follows.`}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", gap: 12, padding: "0 2px" }}>
          {series.map((s, i) => {
            const h = (barValues[i]! / barMax) * 100;
            return (
              <button
                type="button"
                key={s.label}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                aria-label={fmt(i)}
                style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end", minWidth: 0, position: "relative" }}
              >
                <span
                  style={{
                    display: "block",
                    width: "100%",
                    height: `${h}%`,
                    minHeight: 3,
                    background: i === n - 1 || hover === i ? "#111" : "#cdcac2",
                    transition: "background .2s",
                  }}
                />
                {hover === i ? (
                  <span className="sales-tip" style={{ left: "50%", bottom: `calc(${h}% + 8px)`, transform: "translateX(-50%)" }}>
                    {fmt(i)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style={{ pointerEvents: "none" }}>
          <polyline points={linePoints} fill="none" stroke="#141414" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="chart-labels" aria-hidden="true">
        {sales.monthLabels.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>

      <div className="plot-footer">
        <span className="plot-legend">
          <span>
            <i className="plot-dot" /> {metric === "revenue" ? "Gross sales" : "Orders"}
          </span>
          <span>
            <i className="plot-line" /> {metric === "revenue" ? "Orders" : "Gross sales"}
          </span>
        </span>
        <span>{demo ? "Demonstration trend, not real sales" : "Paid invoices only"}</span>
      </div>

      <table className="sr-only">
        <caption>Revenue and orders by period</caption>
        <thead>
          <tr>
            <th>Period</th>
            <th>Revenue</th>
            <th>Orders</th>
          </tr>
        </thead>
        <tbody>
          {series.map((s) => (
            <tr key={s.label}>
              <td>{s.label}</td>
              <td>{formatZar(s.revenueCents)}</td>
              <td>{s.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
