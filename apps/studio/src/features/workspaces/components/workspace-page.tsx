"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { CrudRecordDialog, DeleteConfirmDialog, type CrudField, type CrudMedia, type CrudValues } from "@/components/shared/crud-dialogs";
import type { WorkspaceConfig, WorkspaceRow, WorkspaceTone } from "../types";

function toneClass(tone: WorkspaceTone | undefined) {
  return tone ? ` tone-${tone}` : "";
}

function Status({ label, tone }: { label: string; tone?: WorkspaceTone }) {
  return <span className={`workspace-status${toneClass(tone)}`}>{label}</span>;
}


/* ───────── Presentation helpers (UI only) ───────── */
const singular = (entity: string) => (entity.endsWith("ies") ? `${entity.slice(0, -3)}y` : entity.endsWith("s") ? entity.slice(0, -1) : entity);
const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const RECORD_HEADER: Record<string, string> = { editions: "Artwork / Edition" };
const recordHeader = (entity: string) => RECORD_HEADER[entity] ?? capitalise(singular(entity));
const FACT_TITLE: Record<string, string> = {
  customers: "Customer details",
  orders: "Order details",
  editions: "Edition details",
  bookings: "Booking details",
  invoices: "Invoice details",
  enquiries: "Contact details",
  campaigns: "Campaign details",
};
const titleCase = (value: string) => value.replace(/\b\w/g, (c) => c.toUpperCase());

function toneForValue(value: string): WorkspaceTone | undefined {
  const v = value.toLowerCase();
  if (["paid", "high", "active", "regular", "confirmed", "completed", "qualified", "converted", "delivered"].includes(v)) return "success";
  if (["pending", "awaiting payment", "scheduled", "low stock"].includes(v)) return "warning";
  if (["partially paid", "in progress", "in production", "running"].includes(v)) return "info";
  if (["overdue", "failed", "cancelled"].includes(v)) return "danger";
  return undefined;
}

const FACT_ICONS: Record<string, IconName> = {
  "full name": "user", customer: "user", contact: "user", client: "user",
  email: "mail", phone: "phone", company: "building", location: "pin",
  "customer since": "calendar", reference: "hash", subject: "file", artwork: "image", interest: "hash", message: "mail",
  "target audience": "users", channel: "mail", goal: "star", sent: "calendar", duration: "clock", revenue: "layers",
  type: "layers", edition: "image", "edition number": "hash", "payment method": "layers", "shoot type": "camera",
  purpose: "layers", "team size": "users", owner: "user",
  "email engagement": "mail", "purchase frequency": "refresh", "booking engagement": "calendar",
};
const factIcon = (label: string): IconName | null => FACT_ICONS[label.toLowerCase()] ?? null;
const FACT_ICON_ENTITIES = new Set(["customers", "enquiries", "bookings", "invoices", "campaigns"]);

function actionIcon(action: string): IconName {
  const a = action.toLowerCase();
  if (a.includes("message") || a.includes("reply")) return "mail";
  if (a.includes("booking") || a.includes("deliverable")) return "calendar";
  if (a.includes("order")) return "cart";
  if (a.includes("invoice") || a.includes("credit") || a.includes("inventory")) return "file";
  if (a.includes("payment") || a.includes("fulfilment")) return "layers";
  if (a.includes("website")) return "eye";
  if (a.includes("report")) return "bars";
  if (a.includes("duplicate")) return "copy";
  if (a.includes("edit")) return "pencil";
  if (a.includes("resend")) return "send";
  if (a.includes("campaign")) return "megaphone";
  return "arrow";
}

const parseRand = (value: string | undefined) => Number((value ?? "").replace(/[^0-9]/g, "")) || 0;
const formatRand = (value: number) => `R ${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

function pageNumbers(count: number, current: number): Array<number | "gap"> {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, 5, "gap", count];
  if (current >= count - 2) return [1, "gap", count - 4, count - 3, count - 2, count - 1, count];
  return [1, "gap", current - 1, current, current + 1, "gap", count];
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);
  const showFactIcons = FACT_ICON_ENTITIES.has(config.entity);
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
            <button type="button" className="record-edit" onClick={onEdit} aria-label={`Edit ${record.title}`}><Icon name="pencil" size={14} /> Edit</button>
            <div className="record-more" ref={menuRef}>
              <button type="button" className="record-more-trigger" onClick={() => setMenuOpen((open) => !open)} aria-haspopup="menu" aria-expanded={menuOpen} aria-label={`More actions for ${record.title}`}><Icon name="more" size={16} /></button>
              {menuOpen ? (
                <div className="record-more-menu" role="menu">
                  <Link role="menuitem" href={`/${config.entity}/${encodeURIComponent(record.id)}`} onClick={() => setMenuOpen(false)}><Icon name="external" size={14} /> Open full record</Link>
                  <button type="button" role="menuitem" className="is-danger" onClick={() => { setMenuOpen(false); onDelete(); }}><Icon name="trash" size={14} /> Delete record</button>
                </div>
              ) : null}
            </div>
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
              <strong className={`tabnum${toneClass(metric.tone)}`} data-long={metric.value.length > 9 ? "true" : undefined}>{metric.value}</strong>
            </div>
          ))}
        </div>

        <div className={`record-info-grid${detail.secondaryFacts || detail.description ? " has-secondary" : ""}`}>
          <section>
            <h3>{FACT_TITLE[config.entity] ?? `${capitalise(singular(config.entity))} details`}</h3>
            <dl>
              {detail.facts.map((fact) => {
                const iconName = showFactIcons ? factIcon(fact.label) : null;
                return (
                  <div key={fact.label}>
                    <dt>{iconName ? <Icon name={iconName} size={13} /> : null}{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                );
              })}
            </dl>
          </section>
          {detail.secondaryFacts || detail.description ? (
            <section>
              <h3>{detail.secondaryTitle === "Collector profile" ? <Icon name="crown" size={14} /> : null}{detail.secondaryTitle ?? "Overview"}</h3>
              {detail.description ? <p>{detail.description}</p> : null}
              {detail.secondaryFacts ? (
                <dl>
                  {detail.secondaryFacts.map((fact) => {
                    const tone = toneForValue(fact.value);
                    const iconName = showFactIcons ? factIcon(fact.label) : null;
                    return (
                      <div key={fact.label}>
                        <dt>{iconName ? <Icon name={iconName} size={13} /> : null}{fact.label}</dt>
                        <dd className={tone ? `tone-${tone}` : undefined}>{fact.value}</dd>
                      </div>
                    );
                  })}
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

        <footer className="record-actions" data-count={config.detailActions.length}>
          {config.detailActions.map((action, index) => (
            <button key={action} type="button" className={`record-action${index === 0 ? " is-primary" : ""}`} onClick={() => onDemoAction(action)}><Icon name={actionIcon(action)} size={15} /> <span>{titleCase(action)}</span></button>
          ))}
        </footer>
      </div>
    </aside>
  );
}

function BookingsCalendar({ rows }: { rows: WorkspaceRow[] }) {
  const [mode, setMode] = useState<"month" | "week" | "day">("month");
  const [cursor, setCursor] = useState(() => new Date(2026, 10, 18, 12));
  const parseDate = (value: string) => {
    const [day, monthName, year] = value.split(" ");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return new Date(Number(year), months.indexOf(monthName ?? "Nov"), Number(day), 12);
  };
  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const eventsFor = (date: Date) => rows.filter((row) => sameDay(parseDate(row.cells.date ?? "18 Nov 2026"), date));
  const shift = (direction: number) => setCursor((current) => { const next = new Date(current); if (mode === "month") next.setMonth(next.getMonth() + direction); else if (mode === "week") next.setDate(next.getDate() + direction * 7); else next.setDate(next.getDate() + direction); return next; });
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 12);
  const monthGridStart = new Date(monthStart); monthGridStart.setDate(1 - ((monthStart.getDay() + 6) % 7));
  const monthDays = Array.from({ length: 42 }, (_, index) => { const date = new Date(monthGridStart); date.setDate(monthGridStart.getDate() + index); return date; });
  const weekStart = new Date(cursor); weekStart.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, index) => { const date = new Date(weekStart); date.setDate(weekStart.getDate() + index); return date; });
  const title = mode === "month" ? cursor.toLocaleDateString("en-ZA", { month: "long", year: "numeric" }) : mode === "week" ? `${weekDays[0]?.toLocaleDateString("en-ZA", { day: "2-digit", month: "short" })} — ${weekDays[6]?.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })}` : cursor.toLocaleDateString("en-ZA", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const hours = Array.from({ length: 12 }, (_, index) => index + 7);
  return <section className="booking-calendar" aria-label="Booking calendar">
    <header><div><button type="button" className="button secondary" onClick={()=>setCursor(new Date(2026,10,18,12))}>Today</button><button type="button" onClick={()=>shift(-1)} aria-label="Previous period">←</button><button type="button" onClick={()=>shift(1)} aria-label="Next period">→</button><h2>{title}</h2></div><div className="calendar-mode" role="tablist">{(["month","week","day"] as const).map((item)=><button type="button" role="tab" aria-selected={mode===item} key={item} onClick={()=>setMode(item)}>{item}</button>)}</div></header>
    {mode === "month" ? <div className="calendar-month"><div className="calendar-weekdays">{["MON","TUE","WED","THU","FRI","SAT","SUN"].map((day)=><span key={day}>{day}</span>)}</div><div className="calendar-month-grid">{monthDays.map((date)=><div key={date.toISOString()} className={`${date.getMonth()!==cursor.getMonth()?"is-outside ":""}${sameDay(date,new Date(2026,10,18))?"is-today":""}`}><button type="button" onClick={()=>{setCursor(date);setMode("day")}}>{date.getDate()}</button>{eventsFor(date).map((event)=><Link href={`/bookings/${event.id}`} className={`calendar-event tone-${event.tone??"neutral"}`} key={event.id}><strong>{event.cells.schedule?.split("–")[0] ?? "08:00"}</strong><span>{event.title}</span><small>{event.cells.client}</small></Link>)}</div>)}</div></div> : null}
    {mode === "week" ? <div className="calendar-week"><div className="calendar-week-head"><span>GMT+2</span>{weekDays.map((date)=><button type="button" className={sameDay(date,new Date(2026,10,18))?"is-today":""} key={date.toISOString()} onClick={()=>{setCursor(date);setMode("day")}}><small>{date.toLocaleDateString("en-ZA",{weekday:"short"})}</small><strong>{date.getDate()}</strong></button>)}</div><div className="calendar-week-body"><div className="calendar-hours">{hours.map((hour)=><span key={hour}>{String(hour).padStart(2,"0")}:00</span>)}</div>{weekDays.map((date)=><div className="calendar-day-column" key={date.toISOString()}>{hours.map((hour)=><i key={hour}/>) }{eventsFor(date).map((event)=>{const start=Number(event.cells.schedule?.slice(0,2)??8);const end=Number(event.cells.schedule?.slice(6,8)??start+2);return <Link href={`/bookings/${event.id}`} key={event.id} style={{top:`${(start-7)*52+3}px`,height:`${Math.max(46,(end-start)*52-6)}px`}} className={`calendar-event tone-${event.tone??"neutral"}`}><strong>{event.cells.schedule}</strong><span>{event.title}</span><small>{event.cells.client}</small></Link>})}</div>)}</div></div> : null}
    {mode === "day" ? <div className="calendar-day-view"><div className="calendar-day-summary"><span>{eventsFor(cursor).length} bookings</span><strong>{cursor.toLocaleDateString("en-ZA",{weekday:"long"})}</strong><small>Studio availability · 07:00–19:00</small></div><div className="calendar-day-timeline">{hours.map((hour)=><div key={hour}><time>{String(hour).padStart(2,"0")}:00</time><span>{eventsFor(cursor).filter((event)=>Number(event.cells.schedule?.slice(0,2)??8)===hour).map((event)=><Link href={`/bookings/${event.id}`} className={`calendar-event tone-${event.tone??"neutral"}`} key={event.id}><strong>{event.cells.schedule}</strong><span>{event.title}</span><small>{event.cells.client} · {event.cells.type}</small></Link>)}</span></div>)}</div></div> : null}
  </section>;
}


const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SCHEDULE_TODAY = new Date(2026, 10, 18, 12);

function parseBookingDate(value: string | undefined) {
  const [day, monthName, year] = (value ?? "18 Nov 2026").split(" ");
  return new Date(Number(year), Math.max(0, MONTHS_SHORT.indexOf(monthName ?? "Nov")), Number(day), 12);
}
const sameCalendarDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const bookingDot = (tone: WorkspaceTone | undefined) => (tone === "success" ? "is-confirmed" : tone === "warning" ? "is-pending" : tone === "info" ? "is-progress" : "");

/** Compact schedule shown next to the bookings table: mini calendar, view tabs and the next shoots. */
function BookingsSchedule({ rows, selectedId, onSelect }: { rows: WorkspaceRow[]; selectedId: string; onSelect: (id: string) => void }) {
  const [mode, setMode] = useState<"month" | "week" | "day">("month");
  const [cursor, setCursor] = useState(SCHEDULE_TODAY);
  const eventsFor = (date: Date) => rows.filter((row) => sameCalendarDay(parseBookingDate(row.cells.date), date));
  const shift = (direction: number) => setCursor((current) => {
    const next = new Date(current);
    if (mode === "month") next.setMonth(next.getMonth() + direction);
    else next.setDate(next.getDate() + direction * (mode === "week" ? 7 : 1));
    return next;
  });
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 12);
  const gridStart = new Date(monthStart);
  gridStart.setDate(1 - ((monthStart.getDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
  const weekStart = new Date(cursor);
  weekStart.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
  const upcoming = rows
    .map((row) => ({ row, date: parseBookingDate(row.cells.date) }))
    .filter(({ date }) => date.getTime() >= new Date(2026, 10, 18).getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3);
  const heading = mode === "day"
    ? cursor.toLocaleDateString("en-ZA", { weekday: "long", day: "2-digit", month: "long" })
    : cursor.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
  const listFor = mode === "day" ? [cursor] : weekDays;

  return (
    <aside className="booking-schedule" aria-label="Schedule">
      <div className="booking-schedule-label">Schedule</div>
      <div className="booking-schedule-tabs" role="tablist" aria-label="Schedule view">
        {(["month", "week", "day"] as const).map((item) => (
          <button type="button" role="tab" key={item} aria-selected={mode === item} onClick={() => setMode(item)}>{capitalise(item)}</button>
        ))}
      </div>
      <div className="booking-schedule-nav">
        <button type="button" onClick={() => shift(-1)} aria-label="Previous period">‹</button>
        <strong>{heading}</strong>
        <button type="button" onClick={() => shift(1)} aria-label="Next period">›</button>
      </div>
      {mode === "month" ? (
        <div className="booking-mini-calendar">
          {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => <span className="dow" key={day}>{day}</span>)}
          {days.map((date) => {
            const events = eventsFor(date);
            const outside = date.getMonth() !== cursor.getMonth();
            return (
              <button
                type="button"
                key={date.toISOString()}
                className={`${outside ? "is-outside " : ""}${sameCalendarDay(date, SCHEDULE_TODAY) ? "is-today" : ""}`}
                aria-label={`${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}${events.length ? `, ${events.length} booking${events.length > 1 ? "s" : ""}` : ""}`}
                onClick={() => { const first = events[0]; if (first) onSelect(first.id); }}
              >
                <span>{date.getDate()}</span>
                <span className="dots">{events.map((event) => <i key={event.id} className={bookingDot(event.tone)} />)}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="booking-day-list">
          {listFor.map((date) => {
            const events = eventsFor(date);
            return (
              <div key={date.toISOString()}>
                <time>{date.toLocaleDateString("en-ZA", { weekday: "short", day: "2-digit", month: "short" })}</time>
                {events.length ? events.map((event) => (
                  <button type="button" key={event.id} className={selectedId === event.id ? "is-selected" : ""} onClick={() => onSelect(event.id)}><i className={bookingDot(event.tone)} />{event.title}<small>{event.cells.schedule?.split("–")[0]}</small></button>
                )) : <span className="empty">No bookings</span>}
              </div>
            );
          })}
        </div>
      )}
      <div className="booking-upcoming">
        <div className="booking-schedule-label">Upcoming (next 7 days)</div>
        {upcoming.map(({ row, date }) => (
          <button type="button" key={row.id} className={selectedId === row.id ? "is-selected" : ""} onClick={() => onSelect(row.id)}>
            <i className={bookingDot(row.tone)} />
            <span>{String(date.getDate()).padStart(2, "0")} {MONTHS_SHORT[date.getMonth()]}</span>
            <strong>{row.title}</strong>
            <small>{row.cells.schedule?.split("–")[0]}</small>
          </button>
        ))}
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
  const [workspaceView, setWorkspaceView] = useState<"list" | "calendar">("list");
  const [page, setPage] = useState(1);
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

  const bucketTotal = activeBucket === "all" ? (config.tabs[0]?.count ?? rows.length) : (config.tabs.find((tab) => tab.bucket === activeBucket)?.count ?? rows.length);
  const totalRecords = query.trim() ? rows.length : Math.max(bucketTotal, rows.length);
  const pageCount = Math.max(1, Math.ceil(totalRecords / 8));
  const hasStatusColumn = config.columns.some((column) => column.key === "status");

  const renderCell = (column: WorkspaceConfig["columns"][number], item: WorkspaceRow) => {
    if (column.key === "status") return <Status label={item.status} tone={item.tone} />;
    if (column.key === "payment") return <Status label={item.cells.payment ?? "—"} tone={toneForValue(item.cells.payment ?? "")} />;
    if (config.entity === "bookings" && column.key === "date") return <span className="cell-stack"><strong>{item.cells.date}</strong><small>{item.cells.schedule}</small></span>;
    if (config.entity === "invoices" && column.key === "paid") return item.cells.paid ?? formatRand(Math.max(0, parseRand(item.cells.amount) - parseRand(item.cells.balance)));
    return item.cells[column.key] ?? "—";
  };

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

  const saveRecord = (values: CrudValues, media?: CrudMedia) => {
    const cells = Object.fromEntries(config.columns.map((column) => [column.key, values[`cell:${column.key}`] || "—"]));
    if (dialogMode === "edit" && editingRecord) {
      setAllRows((current) => current.map((record) => record.id === editingRecord.id ? {
        ...record,
        title: values.title ?? editingRecord.title,
        subtitle: values.subtitle ?? editingRecord.subtitle,
        status: values.status || record.status,
        bucket: values.bucket || record.bucket,
        cells,
        image: media?.images.find((image) => image.role === "main")?.url ?? record.image,
        images: media?.images ?? record.images,
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
        image: media?.images.find((image) => image.role === "main")?.url ?? template.image,
        images: media?.images ?? template.images,
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
            <button type="button" className={`filter-icon${config.entity === "bookings" && workspaceView === "calendar" ? " is-active" : ""}`} onClick={() => config.entity === "bookings" ? setWorkspaceView((current)=>current === "list" ? "calendar" : "list") : demoAction("Advanced filters")} aria-label={config.entity === "bookings" ? `Switch to ${workspaceView === "list" ? "calendar" : "list"} view` : "Advanced filters"} title={config.entity === "bookings" ? `Switch to ${workspaceView === "list" ? "calendar" : "list"} view` : "Advanced filters"}><Icon name={config.entity === "bookings" && workspaceView === "calendar" ? "bars" : config.entity === "bookings" ? "calendar" : "sliders"} size={18} /></button>
          </div>

          {config.entity === "bookings" && workspaceView === "calendar" ? <BookingsCalendar rows={rows}/> : <div className={config.entity === "bookings" ? "bookings-split" : "workspace-split"}><div className="workspace-list-main"><div className="workspace-table-wrap">
            <table className="workspace-table">
              <thead><tr><th className="select-cell"><span className="fake-check" /></th><th>{recordHeader(config.entity)}</th>{config.columns.map((column) => <th key={column.key} className={column.align ? `align-${column.align}` : ""}>{column.label}</th>)}{hasStatusColumn ? null : <th>Status</th>}<th aria-label="Actions" /></tr></thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id} className={selected?.id === item.id ? "is-selected" : ""}>
                    <td className="select-cell"><span className="fake-check" /></td>
                    <td className="record-cell">
                      <Link href={`/${config.entity}/${encodeURIComponent(item.id)}`} onClick={() => setSelectedId(item.id)} aria-label={`Open full record for ${item.title}`}>
                        <span className="row-thumb"><Image src={item.image ?? ART_FALLBACK} alt="" fill sizes="48px" unoptimized /></span>
                        <span><strong>{item.title}</strong><small>{item.subtitle}</small></span>
                      </Link>
                    </td>
                    {config.columns.map((column) => <td key={column.key} className={`${column.align ? `align-${column.align}` : ""} tabnum`}>{renderCell(column, item)}</td>)}
                    {hasStatusColumn ? null : <td><Status label={item.status} tone={item.tone} /></td>}
                    <td><button type="button" className="row-more" onClick={() => { setSelectedId(item.id); openEdit(item.id); }} aria-label={`Edit ${item.title}`}>•••</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 ? <div className="workspace-empty">No matching {config.entity}. Try another search or filter.</div> : null}
          </div>
          <footer className="workspace-list-footer"><span>Showing 1 – {rows.length} of {totalRecords} {config.entity}</span><nav aria-label="Pagination"><button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>‹</button>{pageNumbers(pageCount, page).map((item, index) => item === "gap" ? <span key={`gap-${index}`} aria-hidden="true">…</span> : <button type="button" key={item} className={item === page ? "active" : ""} aria-current={item === page ? "page" : undefined} onClick={() => { setPage(1); if (item !== 1) showNotice("Only the first page of sample records exists in this demo workspace."); }}>{item}</button>)}<button type="button" aria-label="Next page" disabled={page === pageCount} onClick={() => { showNotice("Only the first page of sample records exists in this demo workspace."); }}>›</button></nav></footer></div>{config.entity === "bookings" ? <BookingsSchedule rows={allRows} selectedId={selected?.id ?? ""} onSelect={setSelectedId} /> : null}</div>}
        </section>

        {selected ? <DetailPanel key={selected.id} config={config} record={selected} onDemoAction={demoAction} onEdit={() => openEdit(selected.id)} onDelete={() => setDeleteId(selected.id)} /> : <aside className="record-panel workspace-empty">Create a record to begin.</aside>}
      </div>

      {notice ? <div className="demo-toast" role="status"><strong>Demo workspace</strong><span>{notice}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">×</button></div> : null}
      {dialogMode ? <CrudRecordDialog mode={dialogMode} entity={config.entity} fields={recordFields} initialValues={dialogMode === "edit" ? valuesFor(editingRecord) : undefined} initialImages={dialogMode === "edit" ? editingRecord?.images : []} supportsMedia={["editions","bookings","campaigns"].includes(config.entity)} onClose={() => { setDialogMode(null); setEditingId(null); }} onSave={saveRecord} /> : null}
      {deleteRecord ? <DeleteConfirmDialog entityLabel={config.entity} recordLabel={deleteRecord.title} onCancel={() => setDeleteId(null)} onConfirm={deleteSelected} /> : null}
    </div>
  );
}

const ART_FALLBACK = "/artwork-placeholders/dune.svg";

