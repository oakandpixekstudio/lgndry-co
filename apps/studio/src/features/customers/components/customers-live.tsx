"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { createCustomer, fetchCustomers, saveCustomerNotes, setCustomerArchived, type LiveCustomer } from "../db";

const zone = "Africa/Johannesburg";
const day = (iso: string) => new Intl.DateTimeFormat("en-ZA", { timeZone: zone, day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
const SOURCE_LABEL: Record<string, string> = { storefront: "Website enquiry", newsletter: "Newsletter", manual: "Added by hand" };
const sourceLabel = (source: string | null) => (source ? (SOURCE_LABEL[source] ?? source) : "Unknown");
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]!.toUpperCase()).join("") || "?";

type Filter = "all" | "enquirers" | "subscribers" | "manual" | "archived";
const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" }, { id: "enquirers", label: "Enquirers" }, { id: "subscribers", label: "Subscribers" },
  { id: "manual", label: "Added by hand" }, { id: "archived", label: "Archived" },
];

export function CustomersLive({ initial, workspaceId, canEdit }: { initial: LiveCustomer[]; workspaceId: string; canEdit: boolean }) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initial.find((c) => !c.archived)?.id ?? null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [notesDraft, setNotesDraft] = useState<{ id: string; text: string } | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", notes: "" });

  const matches = (item: LiveCustomer, id: Filter) =>
    id === "archived" ? item.archived : !item.archived && (id === "all" || (id === "enquirers" && item.enquiries.length > 0) || (id === "subscribers" && item.subscribed) || (id === "manual" && item.source === "manual"));
  const counts = useMemo(() => Object.fromEntries(FILTERS.map(({ id }) => [id, items.filter((item) => matches(item, id)).length])) as Record<Filter, number>, [items]);
  const monthAgo = useMemo(() => new Date(new Date().getTime() - 30 * 86_400_000).toISOString(), []);

  const visible = items.filter((item) => {
    if (!matches(item, filter)) return false;
    const q = query.trim().toLowerCase();
    return !q || `${item.name} ${item.email ?? ""} ${item.company ?? ""} ${item.phone ?? ""}`.toLowerCase().includes(q);
  });
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const shown = adding ? null : (selected && visible.some((v) => v.id === selected.id) ? selected : visible[0] ?? null);
  const notes = shown && notesDraft?.id === shown.id ? notesDraft.text : (shown?.notes ?? "");
  const notesChanged = shown !== null && notes.trim() !== shown.notes.trim();

  const patch = (id: string, change: Partial<LiveCustomer>) => setItems((current) => current.map((item) => (item.id === id ? { ...item, ...change } : item)));
  const fail = (message: string) => {
    setError(message);
    setBusy(false);
  };

  const add = async (event: FormEvent) => {
    event.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return fail("The studio is not connected to the database.");
    setBusy(true);
    setError(null);
    const result = await createCustomer(supabase, workspaceId, form);
    if ("error" in result) return fail(result.error);
    setItems((current) => [result.customer, ...current]);
    setSelectedId(result.customer.id);
    setFilter("all");
    setQuery("");
    setAdding(false);
    setForm({ name: "", email: "", phone: "", company: "", notes: "" });
    setBusy(false);
  };

  const saveNotes = async () => {
    if (!shown) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return fail("The studio is not connected to the database.");
    setBusy(true);
    setError(null);
    const problem = await saveCustomerNotes(supabase, shown.id, notes);
    if (problem) return fail(problem);
    patch(shown.id, { notes: notes.trim() });
    setNotesDraft(null);
    setBusy(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const toggleArchive = async () => {
    if (!shown) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return fail("The studio is not connected to the database.");
    setBusy(true);
    setError(null);
    const problem = await setCustomerArchived(supabase, shown.id, !shown.archived);
    if (problem) return fail(problem);
    patch(shown.id, { archived: !shown.archived });
    setBusy(false);
  };

  const refresh = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    try {
      setItems(await fetchCustomers(supabase, workspaceId));
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not refresh.");
    }
    setBusy(false);
  };

  return (
    <div className="cat-page enq-page">
      <header className="cat-hero">
        <div>
          <span className="eyebrow">Customers</span>
          <h1 className="workspace-title">Customers. <em>Everyone who has been in touch.</em></h1>
          <p>People appear here on their own when they send an enquiry or join the newsletter, and you can add anyone yourself.</p>
        </div>
        <div className="enq-head-actions">
          <button type="button" className="button secondary" onClick={() => void refresh()} disabled={busy}><Icon name="refresh" size={14} /> Refresh</button>
          {canEdit ? <button type="button" className="button" onClick={() => { setAdding(true); setError(null); }}><Icon name="plus" size={14} /> Add customer</button> : null}
        </div>
      </header>

      <aside className="cat-notice is-live" role="note">
        <strong>Live customers.</strong> {canEdit ? "Notes and archiving are saved to the database. Customers are archived, never deleted, so past orders and invoices always point at someone." : "You can look but not change customers: only the owner and studio managers can edit."}
      </aside>
      {error ? <div className="cat-error" role="alert">{error}</div> : null}

      <section className="cat-stats" aria-label="Customer summary">
        <div><span>Customers</span><strong>{counts.all}</strong></div>
        <div><span>Have enquired</span><strong>{counts.enquirers}</strong></div>
        <div><span>Newsletter subscribers</span><strong>{counts.subscribers}</strong></div>
        <div><span>New in 30 days</span><strong>{items.filter((item) => !item.archived && item.createdAt >= monthAgo).length}</strong></div>
      </section>

      <div className="cat-toolbar">
        <div className="workspace-tabs" role="tablist" aria-label="Filter customers">
          {FILTERS.map(({ id, label }) => (
            <button key={id} type="button" role="tab" aria-selected={filter === id} onClick={() => { setFilter(id); setAdding(false); }}>{label} ({counts[id]})</button>
          ))}
        </div>
        <label className="workspace-search cat-search">
          <Icon name="search" size={18} />
          <span className="sr-only">Search customers</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, email, company or phone" />
        </label>
      </div>

      {items.length === 0 && !adding ? (
        <div className="cat-empty-box">No customers yet. They appear here when someone sends an enquiry or joins the newsletter{canEdit ? ", or you can add one yourself." : "."}</div>
      ) : (
        <div className="enq-split">
          <ul className="enq-list" aria-label="Customers">
            {visible.map((item) => (
              <li key={item.id}>
                <button type="button" className={`enq-row${shown?.id === item.id ? " is-selected" : ""}`} onClick={() => { setSelectedId(item.id); setAdding(false); }} aria-current={shown?.id === item.id}>
                  <span className="enq-row-main">
                    <strong>{item.name}</strong>
                    <small>{item.email ?? "No email"}{item.company ? ` · ${item.company}` : ""}</small>
                    <small>{sourceLabel(item.source)} · since {day(item.createdAt)}</small>
                  </span>
                  <span className="enq-row-side">
                    {item.enquiries.length ? <span className="workspace-status tone-info">{item.enquiries.length} enquir{item.enquiries.length === 1 ? "y" : "ies"}</span> : null}
                    {item.subscribed ? <span className="workspace-status tone-success">Subscribed</span> : null}
                  </span>
                </button>
              </li>
            ))}
            {visible.length === 0 ? <li className="cat-empty-box">No customers match this view.</li> : null}
          </ul>

          {adding ? (
            <form className="cat-card enq-detail" onSubmit={(event) => void add(event)} aria-label="Add a customer">
              <header><div><span className="eyebrow">New customer</span><h2>Add a customer</h2></div></header>
              <div className="cat-fields">
                <label className="wide"><span>Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus /></label>
                <label className="wide"><span>Email</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
                <label><span>Phone (optional)</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+27 82 000 0000" /></label>
                <label><span>Company (optional)</span><input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></label>
                <label className="wide"><span>Notes (optional)</span><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
              </div>
              <div className="enq-actions">
                <button type="submit" className="button" disabled={busy}>{busy ? "Saving…" : "Save customer"}</button>
                <button type="button" className="button secondary" onClick={() => { setAdding(false); setError(null); }}>Cancel</button>
              </div>
            </form>
          ) : shown ? (
            <article className="cat-card enq-detail" aria-label={`Customer ${shown.name}`}>
              <header>
                <div className="cust-title"><span className="cust-avatar" aria-hidden="true">{initials(shown.name)}</span><div><span className="eyebrow">{sourceLabel(shown.source)}</span><h2>{shown.name}</h2></div></div>
                {shown.archived ? <span className="workspace-status tone-warning">Archived</span> : null}
              </header>

              <dl className="enq-facts">
                {shown.email ? <div><dt>Email</dt><dd><a href={`mailto:${shown.email}`}>{shown.email}</a></dd></div> : null}
                {shown.phone ? <div><dt>Phone</dt><dd><a href={`tel:${shown.phone}`}>{shown.phone}</a></dd></div> : null}
                {shown.company ? <div><dt>Company</dt><dd>{shown.company}</dd></div> : null}
                <div><dt>Customer since</dt><dd>{day(shown.createdAt)}</dd></div>
                <div><dt>Marketing emails</dt><dd>{shown.subscribed ? `Subscribed ${shown.subscribedAt ? `on ${day(shown.subscribedAt)}` : ""}` : "Not subscribed"}</dd></div>
                <div><dt>Orders</dt><dd className="cust-muted">None yet. Orders appear here once online ordering opens.</dd></div>
              </dl>

              <section aria-labelledby="cust-enq">
                <h3 id="cust-enq" className="cust-h">Enquiries ({shown.enquiries.length})</h3>
                {shown.enquiries.length === 0 ? <p className="cust-muted">No enquiries from this customer.</p> : (
                  <ul className="cust-enquiries">
                    {shown.enquiries.map((enquiry) => (
                      <li key={enquiry.id}><span><strong>{enquiry.topic || enquiry.category}</strong><small>{enquiry.ref}</small></span><small>{day(enquiry.receivedAt)} · {enquiry.status.replace("_", " ")}</small></li>
                    ))}
                  </ul>
                )}
              </section>

              <label className="cust-notes"><span className="cust-h">Notes</span>
                <textarea rows={4} value={notes} disabled={!canEdit} placeholder="Preferences, history, anything the team should know." onChange={(event) => setNotesDraft({ id: shown.id, text: event.target.value })} />
              </label>
              {canEdit ? (
                <div className="enq-actions">
                  <button type="button" className="button" disabled={!notesChanged || busy} onClick={() => void saveNotes()}>{saved ? "Saved" : busy ? "Saving…" : "Save notes"}</button>
                  <button type="button" className="button secondary" disabled={busy} onClick={() => void toggleArchive()}>{shown.archived ? "Restore customer" : "Archive customer"}</button>
                </div>
              ) : null}
            </article>
          ) : null}
        </div>
      )}
    </div>
  );
}
