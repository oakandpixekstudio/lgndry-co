"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { CrudRecordDialog, DeleteConfirmDialog, type CrudField, type CrudValues } from "@/components/shared/crud-dialogs";
import type { WorkspaceConfig, WorkspaceRow, WorkspaceTone } from "../types";

function toneClass(tone: WorkspaceTone | undefined) {
  return tone ? ` tone-${tone}` : "";
}

function Status({ label, tone }: { label: string; tone?: WorkspaceTone }) {
  return <span className={`workspace-status${toneClass(tone)}`}>{label}</span>;
}

function RelatedSubview({ label, record }: { label: string; record: WorkspaceRow }) {
  const [items, setItems] = useState(() => [
    { id: `${record.id}-${label}-1`, title: `${label} record`, detail: `Linked to ${record.title}`, state: "Current" },
    { id: `${record.id}-${label}-2`, title: `${record.title} update`, detail: "18 Nov 2026 · Studio Manager", state: "Logged" },
  ]);
  const [selected, setSelected] = useState(items[0]?.id ?? "");

  return (
    <section className="record-subview" aria-label={`${label} for ${record.title}`}>
      <header><div><span className="record-eyebrow">{record.id}</span><h3>{label}</h3><p>Related {label.toLowerCase()} for this record.</p></div><button type="button" className="button secondary" onClick={() => { const item = { id: `${record.id}-${label}-${items.length + 1}`, title: `New ${label.toLowerCase()} entry`, detail: "Created just now · Studio Manager", state: "Draft" }; setItems((current) => [item, ...current]); setSelected(item.id); }}><Icon name="plus" size={14} /> Add</button></header>
      <div className="record-subview-list">
        {items.map((item) => <button type="button" key={item.id} className={selected === item.id ? "is-selected" : ""} onClick={() => setSelected(item.id)}><span><strong>{item.title}</strong><small>{item.detail}</small></span><Status label={item.state} tone={item.state === "Current" ? "success" : "neutral"} /></button>)}
      </div>
      <div className="record-subview-preview"><span className="record-eyebrow">Selected entry</span><strong>{items.find((item) => item.id === selected)?.title ?? "No entry selected"}</strong><p>{items.find((item) => item.id === selected)?.detail ?? "Create an entry to begin."}</p></div>
    </section>
  );
}

function DetailPanel({ config, record, onDemoAction, onEdit, onDelete }: { config: WorkspaceConfig; record: WorkspaceRow; onDemoAction: (label: string) => void; onEdit: () => void; onDelete: () => void }) {
  const { detail } = record;
  const [activeTab, setActiveTab] = useState(0);
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
          <div className="record-header-actions">
            <button type="button" onClick={onEdit} aria-label={`Edit ${record.title}`} title="Edit record"><Icon name="pencil" size={15} /></button>
            <button type="button" className="delete-action" onClick={onDelete} aria-label={`Delete ${record.title}`} title="Delete record"><Icon name="trash" size={15} /></button>
          </div>
        </header>

        <div className="record-tabs" role="tablist" aria-label="Record sections">
          {config.detailTabs.map((tab, index) => (
            <button key={tab} type="button" role="tab" aria-selected={index === activeTab} onClick={() => setActiveTab(index)}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 0 ? <>
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
        </> : <RelatedSubview key={`${record.id}-${config.detailTabs[activeTab]}`} label={config.detailTabs[activeTab] ?? "Related records"} record={record} />}

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
  const [allRows, setAllRows] = useState<WorkspaceRow[]>(() => config.rows);
  const [activeBucket, setActiveBucket] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(config.rows[0]?.id ?? "");
  const [notice, setNotice] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const nextRecordNumber = useRef(config.rows.length + 1);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRows.filter((item) => {
      const matchesBucket = activeBucket === "all" || item.bucket === activeBucket || item.status === activeBucket;
      const matchesQuery = !q || `${item.title} ${item.subtitle} ${Object.values(item.cells).join(" ")}`.toLowerCase().includes(q);
      return matchesBucket && matchesQuery;
    });
  }, [activeBucket, allRows, query]);

  const selected = allRows.find((item) => item.id === selectedId) ?? rows[0] ?? allRows[0];
  const editingRecord = allRows.find((item) => item.id === editingId);
  const deleteRecord = allRows.find((item) => item.id === deleteId);
  const recordFields = useMemo<CrudField[]>(() => [
    { key: "title", label: "Record title", placeholder: `Enter ${config.entity} title` },
    { key: "subtitle", label: "Supporting detail" },
    { key: "status", label: "Status" },
    { key: "bucket", label: "Type / category" },
    ...config.columns.map((column) => ({ key: `cell:${column.key}`, label: column.label })),
  ], [config.columns, config.entity]);

  const valuesFor = (record: WorkspaceRow | undefined): CrudValues => Object.fromEntries(recordFields.map((field) => {
    if (!record) return [field.key, ""];
    if (field.key === "title") return [field.key, record.title];
    if (field.key === "subtitle") return [field.key, record.subtitle];
    if (field.key === "status") return [field.key, record.status];
    if (field.key === "bucket") return [field.key, record.bucket];
    return [field.key, record.cells[field.key.replace("cell:", "")] ?? ""];
  }));

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 4500);
  };

  const demoAction = (label: string) => {
    showNotice(`${label} is a prototype action. No external service was contacted.`);
  };

  const openCreate = () => {
    setEditingId(null);
    setDialogMode("create");
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setDialogMode("edit");
  };

  const openRecord = (id: string) => {
    setSelectedId(id);
    if (window.innerWidth <= 1380) {
      window.requestAnimationFrame(() => document.querySelector(".record-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  const saveRecord = (values: CrudValues) => {
    const cells = Object.fromEntries(config.columns.map((column) => [column.key, values[`cell:${column.key}`] || "—"]));
    if (dialogMode === "edit" && editingRecord) {
      setAllRows((current) => current.map((record) => record.id === editingRecord.id ? {
        ...record,
        title: values.title ?? editingRecord.title,
        subtitle: values.subtitle ?? editingRecord.subtitle,
        status: values.status || record.status,
        bucket: values.bucket || record.bucket,
        cells,
      } : record));
      showNotice(`${values.title} was updated in this prototype session.`);
    } else {
      const template = config.rows[0] ?? allRows[0];
      if (!template) return;
      const created: WorkspaceRow = {
        ...template,
        id: `${config.entity.slice(0, 3).toUpperCase()}-NEW-${nextRecordNumber.current++}`,
        title: values.title ?? "Untitled record",
        subtitle: values.subtitle ?? "",
        status: values.status || "Draft",
        bucket: values.bucket || "Draft",
        tone: "neutral",
        cells,
        detail: {
          ...template.detail,
          metrics: template.detail.metrics.map((metric) => ({ ...metric })),
          facts: template.detail.facts.map((fact) => ({ ...fact })),
          secondaryFacts: template.detail.secondaryFacts?.map((fact) => ({ ...fact })),
          tags: template.detail.tags ? [...template.detail.tags] : undefined,
        },
      };
      setAllRows((current) => [created, ...current]);
      setSelectedId(created.id);
      setActiveBucket("all");
      showNotice(`${created.title} was created in this prototype session.`);
    }
    setDialogMode(null);
    setEditingId(null);
  };

  const deleteSelected = () => {
    if (!deleteRecord) return;
    const remaining = allRows.filter((record) => record.id !== deleteRecord.id);
    setAllRows(remaining);
    setSelectedId(remaining[0]?.id ?? "");
    showNotice(`${deleteRecord.title} was deleted from this prototype session.`);
    setDeleteId(null);
  };

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
        <button type="button" className="button workspace-primary-action" onClick={openCreate}>
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
                  <tr key={item.id} className={selected?.id === item.id ? "is-selected" : ""}>
                    <td className="select-cell"><span className="fake-check" /></td>
                    <td className="record-cell">
                      <button type="button" onClick={() => openRecord(item.id)} aria-label={`Open ${item.title}`}>
                        <span className="row-thumb"><Image src={item.image ?? ART_FALLBACK} alt="" fill sizes="48px" unoptimized /></span>
                        <span><strong>{item.title}</strong><small>{item.subtitle}</small></span>
                      </button>
                    </td>
                    {config.columns.map((column) => <td key={column.key} className={`${column.align ? `align-${column.align}` : ""} tabnum`}>{item.cells[column.key] ?? "—"}</td>)}
                    <td><Status label={item.status} tone={item.tone} /></td>
                    <td><button type="button" className="row-more" onClick={() => { setSelectedId(item.id); openEdit(item.id); }} aria-label={`Edit ${item.title}`}>•••</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 ? <div className="workspace-empty">No matching {config.entity}. Try another search or filter.</div> : null}
          </div>
          <footer className="workspace-list-footer"><span>Showing 1–{rows.length} of {config.tabs[0]?.count ?? rows.length} {config.entity}</span><div><button type="button" aria-label="Previous page">‹</button><button type="button" className="active">1</button><button type="button">2</button><button type="button">3</button><span>…</span><button type="button" aria-label="Next page">›</button></div></footer>
        </section>

        {selected ? <DetailPanel key={selected.id} config={config} record={selected} onDemoAction={demoAction} onEdit={() => openEdit(selected.id)} onDelete={() => setDeleteId(selected.id)} /> : <aside className="record-panel workspace-empty">Create a record to begin.</aside>}
      </div>

      {notice ? <div className="demo-toast" role="status"><strong>Demo workspace</strong><span>{notice}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">×</button></div> : null}
      {dialogMode ? <CrudRecordDialog mode={dialogMode} entity={config.entity} fields={recordFields} initialValues={dialogMode === "edit" ? valuesFor(editingRecord) : undefined} onClose={() => { setDialogMode(null); setEditingId(null); }} onSave={saveRecord} /> : null}
      {deleteRecord ? <DeleteConfirmDialog entityLabel={config.entity} recordLabel={deleteRecord.title} onCancel={() => setDeleteId(null)} onConfirm={deleteSelected} /> : null}
    </div>
  );
}

const ART_FALLBACK = "/artwork-placeholders/dune.svg";

