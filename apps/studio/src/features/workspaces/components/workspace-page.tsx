"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import type { WorkspaceConfig, WorkspaceRow, WorkspaceTone } from "../types";

function toneClass(tone: WorkspaceTone | undefined) {
  return tone ? ` tone-${tone}` : "";
}

function Status({ label, tone }: { label: string; tone?: WorkspaceTone }) {
  return <span className={`workspace-status${toneClass(tone)}`}>{label}</span>;
}

function DetailPanel({ config, record, onDemoAction }: { config: WorkspaceConfig; record: WorkspaceRow; onDemoAction: (label: string) => void }) {
  const { detail } = record;
  return (
    <aside className="record-panel" aria-label={`${record.title} details`}>
      <div className="record-art">
        <Image src={record.image ?? "/artwork-placeholders/dune.svg"} alt="Sample monochrome artwork" fill sizes="(max-width: 1000px) 100vw, 38vw" unoptimized />
      </div>
      <div className="record-panel-body">
        <header className="record-header">
          <div className="record-avatar">
            <Image src={record.image ?? "/artwork-placeholders/dune.svg"} alt="" fill sizes="72px" unoptimized />
          </div>
          <div className="record-heading">
            <div className="record-eyebrow">{detail.eyebrow ?? record.id}</div>
            <h2>{record.title}</h2>
            <div className="record-meta">
              <Status label={record.status} tone={record.tone} />
              <span>{record.subtitle}</span>
            </div>
          </div>
          <button type="button" className="record-more" onClick={() => onDemoAction("More actions")} aria-label="More record actions">
            •••
          </button>
        </header>

        <div className="record-tabs" role="tablist" aria-label="Record sections">
          {config.detailTabs.map((tab, index) => (
            <button key={tab} type="button" role="tab" aria-selected={index === 0} onClick={() => index !== 0 && onDemoAction(tab)}>
              {tab}
            </button>
          ))}
        </div>

        <div className="record-metrics">
          {detail.metrics.map((metric) => (
            <div key={metric.label}>
              <span>{metric.label}</span>
              <strong className={`tabnum${toneClass(metric.tone)}`}>{metric.value}</strong>
            </div>
          ))}
        </div>

        <div className={`record-info-grid${detail.secondaryFacts || detail.description ? " has-secondary" : ""}`}>
          <section>
            <h3>{config.entity === "customers" ? "Customer details" : `${config.entity.slice(0, -1)} details`}</h3>
            <dl>
              {detail.facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </section>
          {detail.secondaryFacts || detail.description ? (
            <section>
              <h3>{detail.secondaryTitle ?? "Overview"}</h3>
              {detail.description ? <p>{detail.description}</p> : null}
              {detail.secondaryFacts ? (
                <dl>
                  {detail.secondaryFacts.map((fact) => (
                    <div key={fact.label}>
                      <dt>{fact.label}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </section>
          ) : null}
        </div>

        {detail.tags ? (
          <div className="record-tags" aria-label="Tags">
            {detail.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        ) : null}

        {detail.editionRun ? (
          <section className="edition-register" aria-label="Edition register">
            <div className="detail-section-head"><h3>Edition run</h3><span>{detail.editionRun.total} total</span></div>
            <div className="edition-number-grid">
              {Array.from({ length: detail.editionRun.total }, (_, index) => (
                <span key={index} className={index < detail.editionRun!.sold ? "is-sold" : ""}>{String(index + 1).padStart(2, "0")}</span>
              ))}
            </div>
            <div className="edition-legend"><span><i className="sold" /> Sold ({detail.editionRun.sold})</span><span><i /> Available ({detail.editionRun.total - detail.editionRun.sold})</span></div>
          </section>
        ) : null}

        {detail.progress ? (
          <section className="record-progress" aria-label="Progress">
            <h3>Progress</h3>
            <ol>
              {detail.progress.steps.map((step, index) => (
                <li key={step} className={index <= detail.progress!.current ? "is-complete" : ""}>
                  <i>{index < detail.progress!.current ? "✓" : index + 1}</i><span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {detail.callout ? (
          <div className={`record-callout${toneClass(detail.callout.tone)}`}>
            <Icon name={detail.callout.tone === "success" ? "circle-check" : "image"} size={24} />
            <div><strong>{detail.callout.title}</strong><span>{detail.callout.text}</span></div>
          </div>
        ) : null}

        <footer className="record-actions">
          {config.detailActions.map((action, index) => (
            <button key={action} type="button" className={index === 0 ? "button" : "button secondary"} onClick={() => onDemoAction(action)}>{action}</button>
          ))}
        </footer>
      </div>
    </aside>
  );
}

export function WorkspacePage({ config }: { config: WorkspaceConfig }) {
  const [activeBucket, setActiveBucket] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(config.rows[0]?.id ?? "");
  const [notice, setNotice] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return config.rows.filter((item) => {
      const matchesBucket = activeBucket === "all" || item.bucket === activeBucket || item.status === activeBucket;
      const matchesQuery = !q || `${item.title} ${item.subtitle} ${Object.values(item.cells).join(" ")}`.toLowerCase().includes(q);
      return matchesBucket && matchesQuery;
    });
  }, [activeBucket, config.rows, query]);

  const selected = config.rows.find((item) => item.id === selectedId) ?? rows[0] ?? config.rows[0];
  const demoAction = (label: string) => {
    setNotice(`${label} is a demo-only preview. No record was changed and no external service was contacted.`);
    window.setTimeout(() => setNotice(null), 4500);
  };

  if (!selected) return null;

  return (
    <div className="workspace-page">
      <header className="workspace-hero">
        <div>
          <div className="eyebrow">{config.eyebrow}</div>
          <h1 className="workspace-title">{config.title} <em>{config.editorial}</em></h1>
          <p>{config.subtitle}</p>
        </div>
        <figure>
          <Image src="/artwork-placeholders/waves.svg" alt="Sample artwork: abstract monochrome landscape" fill sizes="42vw" unoptimized loading="eager" />
          <figcaption>Sample artwork</figcaption>
        </figure>
      </header>

      <section className="workspace-intelligence" aria-label={config.intelligenceLabel}>
        <div className="workspace-section-label">{config.intelligenceLabel}</div>
        <div className="workspace-metric-grid">
          {config.metrics.map((metric) => (
            <div className="workspace-metric" key={metric.label}>
              <div><span>{metric.label}</span><Icon name={metric.icon} size={17} /></div>
              <strong className="tabnum">{metric.value}</strong>
              <small className={toneClass(metric.tone)}>{metric.change}</small>
            </div>
          ))}
        </div>
      </section>

      <div className="workspace-tabs-row">
        <div className="workspace-tabs" role="tablist" aria-label={`${config.eyebrow} filters`}>
          {config.tabs.map((tab) => (
            <button key={tab.label} type="button" role="tab" aria-selected={activeBucket === tab.bucket} onClick={() => setActiveBucket(tab.bucket)}>
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
        <button type="button" className="button workspace-primary-action" onClick={() => demoAction(config.primaryAction)}>
          <Icon name="plus" size={15} /> {config.primaryAction}
        </button>
      </div>

      <div className="workspace-master-detail">
        <section className="workspace-list" aria-label={`${config.eyebrow} list`}>
          <div className="workspace-toolbar">
            <label className="workspace-search">
              <Icon name="search" size={18} />
              <span className="sr-only">Search {config.entity}</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={config.searchPlaceholder} />
            </label>
            {config.filters.map((filter) => <button key={filter} type="button" onClick={() => demoAction(filter)}>{filter} <span>⌄</span></button>)}
            <button type="button" className="filter-icon" onClick={() => demoAction("Advanced filters")} aria-label="Advanced filters"><Icon name="sliders" size={18} /></button>
          </div>

          <div className="workspace-table-wrap">
            <table className="workspace-table">
              <thead><tr><th className="select-cell"><span className="fake-check" /></th><th>{config.eyebrow.slice(0, -1) || config.eyebrow}</th>{config.columns.map((column) => <th key={column.key} className={column.align ? `align-${column.align}` : ""}>{column.label}</th>)}<th>Status</th><th aria-label="Actions" /></tr></thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id} className={selected.id === item.id ? "is-selected" : ""}>
                    <td className="select-cell"><span className="fake-check" /></td>
                    <td className="record-cell">
                      <button type="button" onClick={() => setSelectedId(item.id)}>
                        <span className="row-thumb"><Image src={item.image ?? ART_FALLBACK} alt="" fill sizes="48px" unoptimized /></span>
                        <span><strong>{item.title}</strong><small>{item.subtitle}</small></span>
                      </button>
                    </td>
                    {config.columns.map((column) => <td key={column.key} className={`${column.align ? `align-${column.align}` : ""} tabnum`}>{item.cells[column.key] ?? "—"}</td>)}
                    <td><Status label={item.status} tone={item.tone} /></td>
                    <td><button type="button" className="row-more" onClick={() => demoAction("Row actions")} aria-label={`More actions for ${item.title}`}>•••</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 ? <div className="workspace-empty">No matching {config.entity}. Try another search or filter.</div> : null}
          </div>
          <footer className="workspace-list-footer"><span>Showing 1–{rows.length} of {config.tabs[0]?.count ?? rows.length} {config.entity}</span><div><button type="button" aria-label="Previous page">‹</button><button type="button" className="active">1</button><button type="button">2</button><button type="button">3</button><span>…</span><button type="button" aria-label="Next page">›</button></div></footer>
        </section>

        <DetailPanel config={config} record={selected} onDemoAction={demoAction} />
      </div>

      {notice ? <div className="demo-toast" role="status"><strong>Demo workspace</strong><span>{notice}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">×</button></div> : null}
    </div>
  );
}

const ART_FALLBACK = "/artwork-placeholders/dune.svg";

