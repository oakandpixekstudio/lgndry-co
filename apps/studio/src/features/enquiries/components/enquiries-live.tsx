"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { CATEGORY_LABEL, fetchEnquiries, setEnquiryStatus, STATUS_LABEL, STATUS_ORDER, STATUS_TONE, type EnquiryStatus, type LiveEnquiry } from "../db";

const zone = "Africa/Johannesburg";
const when = (iso: string) => new Intl.DateTimeFormat("en-ZA", { timeZone: zone, day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
const short = (iso: string) => new Intl.DateTimeFormat("en-ZA", { timeZone: zone, day: "2-digit", month: "short" }).format(new Date(iso));

type Filter = "all" | EnquiryStatus;

export function EnquiriesLive({ initial, workspaceId, canEdit }: { initial: LiveEnquiry[]; workspaceId: string; canEdit: boolean }) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const counts = useMemo(() => {
    const out: Record<string, number> = { all: items.length };
    for (const status of STATUS_ORDER) out[status] = items.filter((item) => item.status === status).length;
    return out;
  }, [items]);

  const visible = items.filter((item) => {
    if (filter !== "all" && item.status !== filter) return false;
    const q = query.trim().toLowerCase();
    return !q || `${item.name} ${item.email} ${item.topic ?? ""} ${item.ref} ${item.message} ${item.organisation ?? ""}`.toLowerCase().includes(q);
  });
  const selected = items.find((item) => item.id === selectedId) ?? visible[0] ?? null;

  const changeStatus = async (item: LiveEnquiry, status: EnquiryStatus) => {
    if (item.status === status) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return setError("The studio is not connected to the database.");
    setError(null);
    const before = item.status;
    setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status } : entry))); // show it at once
    const problem = await setEnquiryStatus(supabase, item.id, status);
    if (problem) {
      setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status: before } : entry)));
      setError(/row-level security|permission/i.test(problem) ? "You don't have permission to change enquiries. Ask the studio owner." : problem);
    }
  };

  const refresh = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setRefreshing(true);
    setError(null);
    try {
      setItems(await fetchEnquiries(supabase, workspaceId));
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not refresh.");
    }
    setRefreshing(false);
  };

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy. Select the address and copy it by hand.");
    }
  };

  const replyLink = (item: LiveEnquiry) => {
    const subject = `Re: ${item.topic || CATEGORY_LABEL[item.category]} (${item.ref})`;
    const body = `Hi ${item.name.split(" ")[0]},\n\nThank you for getting in touch.\n\n`;
    return `mailto:${item.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="cat-page enq-page">
      <header className="cat-hero">
        <div>
          <span className="eyebrow">Enquiries</span>
          <h1 className="workspace-title">Enquiries. <em>Interest, requests and opportunities.</em></h1>
          <p>Everything visitors send through the website forms lands here, newest first.</p>
        </div>
        <button type="button" className="button secondary" onClick={() => void refresh()} disabled={refreshing}>
          <Icon name="refresh" size={14} /> {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      <aside className="cat-notice is-live" role="note">
        <strong>Live enquiries.</strong> {canEdit ? "Change the status as you work through them." : "You can read enquiries but not change them: only the owner and studio managers can."}
      </aside>
      {error ? <div className="cat-error" role="alert">{error}</div> : null}

      <section className="cat-stats" aria-label="Enquiry summary">
        <div><span>New</span><strong>{counts.new}</strong></div>
        <div><span>In progress</span><strong>{counts.in_progress}</strong></div>
        <div><span>Qualified or converted</span><strong>{(counts.qualified ?? 0) + (counts.converted ?? 0)}</strong></div>
        <div><span>All enquiries</span><strong>{counts.all}</strong></div>
      </section>

      <div className="cat-toolbar">
        <div className="workspace-tabs" role="tablist" aria-label="Filter enquiries">
          {(["all", ...STATUS_ORDER] as Filter[]).map((id) => (
            <button key={id} type="button" role="tab" aria-selected={filter === id} onClick={() => setFilter(id)}>
              {id === "all" ? "All" : STATUS_LABEL[id]} ({counts[id] ?? 0})
            </button>
          ))}
        </div>
        <label className="workspace-search cat-search">
          <Icon name="search" size={18} />
          <span className="sr-only">Search enquiries</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, email, topic or reference" />
        </label>
      </div>

      {items.length === 0 ? (
        <div className="cat-empty-box">No enquiries yet. Messages sent through the website forms will appear here.</div>
      ) : (
        <div className="enq-split">
          <ul className="enq-list" aria-label="Enquiries">
            {visible.map((item) => (
              <li key={item.id}>
                <button type="button" className={`enq-row${selected?.id === item.id ? " is-selected" : ""}${item.status === "new" ? " is-new" : ""}`} onClick={() => setSelectedId(item.id)} aria-current={selected?.id === item.id}>
                  <span className="enq-row-main">
                    <strong>{item.name}</strong>
                    <small>{item.topic || CATEGORY_LABEL[item.category]}{item.artwork && item.artwork.title !== item.topic ? ` · ${item.artwork.title}` : ""}</small>
                    <small className="enq-snippet">{item.message}</small>
                  </span>
                  <span className="enq-row-side">
                    <span className={`workspace-status tone-${STATUS_TONE[item.status]}`}>{STATUS_LABEL[item.status]}</span>
                    <time dateTime={item.receivedAt}>{short(item.receivedAt)}</time>
                  </span>
                </button>
              </li>
            ))}
            {visible.length === 0 ? <li className="cat-empty-box">No enquiries match this view.</li> : null}
          </ul>

          {selected ? (
            <article className="cat-card enq-detail" aria-label={`Enquiry from ${selected.name}`}>
              <header>
                <div>
                  <span className="eyebrow">{selected.ref} · {CATEGORY_LABEL[selected.category]}</span>
                  <h2>{selected.name}</h2>
                </div>
                <span className={`workspace-status tone-${STATUS_TONE[selected.status]}`}>{STATUS_LABEL[selected.status]}</span>
              </header>

              <dl className="enq-facts">
                <div><dt>Email</dt><dd><a href={`mailto:${selected.email}`}>{selected.email}</a></dd></div>
                {selected.phone ? <div><dt>Phone</dt><dd><a href={`tel:${selected.phone.replace(/[^\d+]/g, "")}`}>{selected.phone}</a></dd></div> : null}
                {selected.organisation ? <div><dt>Organisation</dt><dd>{selected.organisation}</dd></div> : null}
                {selected.topic ? <div><dt>About</dt><dd>{selected.topic}</dd></div> : null}
                {selected.artwork ? <div><dt>Work</dt><dd><Link href={`/editions/catalogue/${selected.artwork.slug}`}>{selected.artwork.title}</Link></dd></div> : null}
                {Object.entries(selected.details).filter(([, value]) => value).map(([key, value]) => (
                  <div key={key}><dt>{key[0]?.toUpperCase()}{key.slice(1)}</dt><dd>{value}</dd></div>
                ))}
                <div><dt>Received</dt><dd>{when(selected.receivedAt)} (Johannesburg)</dd></div>
              </dl>

              <blockquote className="enq-message">{selected.message}</blockquote>

              <div className="enq-actions">
                <a className="button" href={replyLink(selected)}><Icon name="mail" size={14} /> Reply by email</a>
                <button type="button" className="button secondary" onClick={() => void copyEmail(selected.email)}><Icon name="copy" size={14} /> {copied ? "Copied" : "Copy email"}</button>
              </div>

              <fieldset className="cat-segment enq-status" disabled={!canEdit}>
                <legend>Status</legend>
                <div role="radiogroup" aria-label="Enquiry status">
                  {STATUS_ORDER.map((status) => (
                    <button key={status} type="button" role="radio" aria-checked={selected.status === status} onClick={() => void changeStatus(selected, status)}>
                      {STATUS_LABEL[status]}
                    </button>
                  ))}
                </div>
              </fieldset>
            </article>
          ) : null}
        </div>
      )}
    </div>
  );
}
