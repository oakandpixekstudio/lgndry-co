"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { createCustomer } from "@/features/customers/db";
import {
  createBooking, fetchBookings, markEnquiryConverted, saveBookingNotes, setBookingStatus,
  MOVABLE, STATUS_LABEL, STATUS_TONE, type BookingStatus, type LiveBooking, type PickCustomer, type PickEnquiry,
} from "../db";

const zone = "Africa/Johannesburg";
const dayFmt = new Intl.DateTimeFormat("en-ZA", { timeZone: zone, weekday: "short", day: "2-digit", month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-ZA", { timeZone: zone, hour: "2-digit", minute: "2-digit", hour12: false });
const when = (item: LiveBooking) => {
  if (!item.startAt) return "Date to be agreed";
  const start = new Date(item.startAt);
  const hasTime = timeFmt.format(start) !== "00:00";
  const end = item.endAt ? ` to ${timeFmt.format(new Date(item.endAt))}` : "";
  return `${dayFmt.format(start)}${hasTime ? `, ${timeFmt.format(start)}${end}` : ""}`;
};

type Tab = "all" | "requests" | "confirmed" | "active" | "completed" | "closed";
const GROUPS: Record<Tab, BookingStatus[] | null> = {
  all: null,
  requests: ["requested", "review", "quoted", "awaiting_deposit"],
  confirmed: ["confirmed", "scheduled"],
  active: ["in_progress", "editing", "delivered"],
  completed: ["completed"],
  closed: ["cancelled", "expired"],
};
const TABS: Array<{ id: Tab; label: string }> = [
  { id: "all", label: "Open" }, { id: "requests", label: "Requests" }, { id: "confirmed", label: "Confirmed" },
  { id: "active", label: "In progress" }, { id: "completed", label: "Completed" }, { id: "closed", label: "Cancelled" },
];
const CLOSED: BookingStatus[] = ["completed", "cancelled", "expired"];
const emptyForm = { enquiryId: "", customerId: "", title: "", serviceType: "", date: "", startTime: "", endTime: "", location: "", brief: "", budgetNote: "", newName: "", newEmail: "" };

export function BookingsLive({ initial, workspaceId, canEdit, customers, enquiries }: {
  initial: LiveBooking[]; workspaceId: string; canEdit: boolean; customers: PickCustomer[]; enquiries: PickEnquiry[];
}) {
  const [items, setItems] = useState(initial);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initial.find((b) => !CLOSED.includes(b.status))?.id ?? null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [notesDraft, setNotesDraft] = useState<{ id: string; text: string } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [newPerson, setNewPerson] = useState(false);
  const [people, setPeople] = useState(customers);

  const inTab = (item: LiveBooking, id: Tab) => {
    const group = GROUPS[id];
    return group ? group.includes(item.status) : !CLOSED.includes(item.status);
  };
  const counts = useMemo(() => Object.fromEntries(TABS.map(({ id }) => [id, items.filter((item) => inTab(item, id)).length])) as Record<Tab, number>, [items]);
  const serviceTypes = useMemo(() => [...new Set(items.map((item) => item.serviceType).filter((s): s is string => Boolean(s)))], [items]);

  const visible = items.filter((item) => {
    if (!inTab(item, tab)) return false;
    const q = query.trim().toLowerCase();
    return !q || `${item.title} ${item.ref} ${item.customer?.name ?? ""} ${item.serviceType ?? ""} ${item.location ?? ""}`.toLowerCase().includes(q);
  });
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const shown = adding ? null : (selected && visible.some((v) => v.id === selected.id) ? selected : visible[0] ?? null);
  const notes = shown && notesDraft?.id === shown.id ? notesDraft.text : (shown?.notes ?? "");
  const notesChanged = shown !== null && notes.trim() !== shown.notes.trim();

  const patch = (id: string, change: Partial<LiveBooking>) => setItems((current) => current.map((item) => (item.id === id ? { ...item, ...change } : item)));
  const fail = (message: string) => {
    setError(message);
    setBusy(false);
  };
  const client = () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) setError("The studio is not connected to the database.");
    return supabase;
  };

  const fromEnquiry = (id: string) => {
    const enquiry = enquiries.find((e) => e.id === id);
    setForm((current) => enquiry
      ? { ...current, enquiryId: id, customerId: enquiry.customerId ?? current.customerId, title: current.title || enquiry.topic || "Photography booking", brief: current.brief || enquiry.message }
      : { ...current, enquiryId: "" });
  };

  const add = async (event: FormEvent) => {
    event.preventDefault();
    const supabase = client();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    let customerId = form.customerId;
    if (newPerson) {
      const made = await createCustomer(supabase, workspaceId, { name: form.newName, email: form.newEmail, phone: "", company: "", notes: "" });
      if ("error" in made) return fail(made.error);
      customerId = made.customer.id;
      setPeople((current) => [...current, { id: made.customer.id, name: made.customer.name, email: made.customer.email }]);
    }
    const result = await createBooking(supabase, workspaceId, { ...form, customerId, enquiryId: form.enquiryId || null });
    if ("error" in result) return fail(result.error);
    if (form.enquiryId) void markEnquiryConverted(supabase, form.enquiryId);
    setItems((current) => [result.booking, ...current]);
    setSelectedId(result.booking.id);
    setTab("all");
    setQuery("");
    setAdding(false);
    setNewPerson(false);
    setForm(emptyForm);
    setBusy(false);
  };

  const move = async (status: BookingStatus) => {
    if (!shown || status === shown.status) return;
    const supabase = client();
    if (!supabase) return;
    const previous = shown.status;
    patch(shown.id, { status });
    setError(null);
    const problem = await setBookingStatus(supabase, shown.id, status);
    if (problem) {
      patch(shown.id, { status: previous });
      setError(problem);
    }
  };

  const saveNotes = async () => {
    if (!shown) return;
    const supabase = client();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const problem = await saveBookingNotes(supabase, shown.id, notes);
    if (problem) return fail(problem);
    patch(shown.id, { notes: notes.trim() });
    setNotesDraft(null);
    setBusy(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const refresh = async () => {
    const supabase = client();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    try {
      setItems(await fetchBookings(supabase, workspaceId));
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not refresh.");
    }
    setBusy(false);
  };

  const field = (key: keyof typeof emptyForm) => ({ value: form[key], onChange: (event: { target: { value: string } }) => setForm({ ...form, [key]: event.target.value }) });
  const upcoming = items.filter((item) => ["confirmed", "scheduled"].includes(item.status) && item.startAt && item.startAt >= new Date().toISOString()).length;

  return (
    <div className="cat-page enq-page">
      <header className="cat-hero">
        <div>
          <span className="eyebrow">Bookings</span>
          <h1 className="workspace-title">Bookings. <em>Studio, location and client shoots.</em></h1>
          <p>Track each photography request from first contact to delivery. A request is not a confirmed shoot until you confirm it.</p>
        </div>
        <div className="enq-head-actions">
          <button type="button" className="button secondary" onClick={() => void refresh()} disabled={busy}><Icon name="refresh" size={14} /> Refresh</button>
          {canEdit ? <button type="button" className="button" onClick={() => { setAdding(true); setError(null); }}><Icon name="plus" size={14} /> New booking</button> : null}
        </div>
      </header>

      <aside className="cat-notice is-live" role="note">
        <strong>Live bookings.</strong> {canEdit ? "Changes are saved to the database. Quotes, deposits and invoices will be added once the studio's prices and payment terms are confirmed, so nothing here takes or records money." : "You can see the shoots assigned to you. Only the owner and studio managers can change bookings."}
      </aside>
      {error ? <div className="cat-error" role="alert">{error}</div> : null}

      <section className="cat-stats" aria-label="Booking summary">
        <div><span>New requests</span><strong>{counts.requests}</strong></div>
        <div><span>Confirmed</span><strong>{counts.confirmed}</strong></div>
        <div><span>Upcoming shoots</span><strong>{upcoming}</strong></div>
        <div><span>In progress</span><strong>{counts.active}</strong></div>
      </section>

      <div className="cat-toolbar">
        <div className="workspace-tabs" role="tablist" aria-label="Filter bookings">
          {TABS.map(({ id, label }) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => { setTab(id); setAdding(false); }}>{label} ({counts[id]})</button>
          ))}
        </div>
        <label className="workspace-search cat-search">
          <Icon name="search" size={18} />
          <span className="sr-only">Search bookings</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by client, title, reference or place" />
        </label>
      </div>

      {items.length === 0 && !adding ? (
        <div className="cat-empty-box">No bookings yet.{canEdit ? " Use New booking to add one, or start one from a photography enquiry." : ""}</div>
      ) : (
        <div className="enq-split">
          <ul className="enq-list" aria-label="Bookings">
            {visible.map((item) => (
              <li key={item.id}>
                <button type="button" className={`enq-row${shown?.id === item.id ? " is-selected" : ""}`} onClick={() => { setSelectedId(item.id); setAdding(false); }} aria-current={shown?.id === item.id}>
                  <span className="enq-row-main">
                    <strong>{item.title}</strong>
                    <small>{item.customer?.name ?? "Customer not visible"}{item.serviceType ? ` · ${item.serviceType}` : ""}</small>
                    <small>{when(item)}</small>
                  </span>
                  <span className="enq-row-side">
                    <span className={`workspace-status tone-${STATUS_TONE[item.status]}`}>{STATUS_LABEL[item.status]}</span>
                    <small>{item.ref}</small>
                  </span>
                </button>
              </li>
            ))}
            {visible.length === 0 ? <li className="cat-empty-box">No bookings in this view.</li> : null}
          </ul>

          {adding ? (
            <form className="cat-card enq-detail" onSubmit={(event) => void add(event)} aria-label="New booking">
              <header><div><span className="eyebrow">New booking</span><h2>Add a booking</h2></div></header>
              <div className="cat-fields">
                {enquiries.length ? (
                  <label className="wide"><span>Start from a photography enquiry (optional)</span>
                    <select value={form.enquiryId} onChange={(event) => fromEnquiry(event.target.value)}>
                      <option value="">No, start blank</option>
                      {enquiries.map((e) => <option key={e.id} value={e.id}>{e.name} · {e.topic || e.ref}</option>)}
                    </select>
                  </label>
                ) : null}
                {newPerson ? (
                  <>
                    <label><span>Customer name</span><input value={form.newName} onChange={(e) => setForm({ ...form, newName: e.target.value })} required /></label>
                    <label><span>Customer email</span><input type="email" value={form.newEmail} onChange={(e) => setForm({ ...form, newEmail: e.target.value })} required /></label>
                  </>
                ) : (
                  <label className="wide"><span>Customer</span>
                    <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required>
                      <option value="">Choose a customer</option>
                      {people.map((c) => <option key={c.id} value={c.id}>{c.name}{c.email ? ` · ${c.email}` : ""}</option>)}
                    </select>
                  </label>
                )}
                <p className="wide cust-muted"><button type="button" className="link-button" onClick={() => setNewPerson(!newPerson)}>{newPerson ? "Choose an existing customer instead" : "Customer not listed? Add a new one"}</button></p>
                <label className="wide"><span>Title</span><input {...field("title")} required placeholder="For example: Portrait series, Coastline editorial" /></label>
                <label><span>Shoot type (optional)</span><input {...field("serviceType")} list="booking-service-types" /><datalist id="booking-service-types">{serviceTypes.map((s) => <option key={s} value={s} />)}</datalist></label>
                <label><span>Place (optional)</span><input {...field("location")} /></label>
                <label><span>Date (optional)</span><input type="date" {...field("date")} /></label>
                <label><span>Start time</span><input type="time" {...field("startTime")} /></label>
                <label><span>End time</span><input type="time" {...field("endTime")} /></label>
                <label><span>Budget they mentioned (optional)</span><input {...field("budgetNote")} placeholder="Their words, not a quote" /></label>
                <label className="wide"><span>Brief (optional)</span><textarea rows={3} {...field("brief")} /></label>
              </div>
              <div className="enq-actions">
                <button type="submit" className="button" disabled={busy}>{busy ? "Saving…" : "Save booking"}</button>
                <button type="button" className="button secondary" onClick={() => { setAdding(false); setNewPerson(false); setError(null); }}>Cancel</button>
              </div>
            </form>
          ) : shown ? (
            <article className="cat-card enq-detail" aria-label={`Booking ${shown.title}`}>
              <header>
                <div><span className="eyebrow">{shown.ref}{shown.serviceType ? ` · ${shown.serviceType}` : ""}</span><h2>{shown.title}</h2></div>
                <span className={`workspace-status tone-${STATUS_TONE[shown.status]}`}>{STATUS_LABEL[shown.status]}</span>
              </header>

              <dl className="enq-facts">
                <div><dt>When</dt><dd>{when(shown)}</dd></div>
                {shown.location ? <div><dt>Place</dt><dd>{shown.location}</dd></div> : null}
                <div><dt>Client</dt><dd>{shown.customer ? shown.customer.name : "Not visible to your role"}</dd></div>
                {shown.customer?.email ? <div><dt>Email</dt><dd><a href={`mailto:${shown.customer.email}`}>{shown.customer.email}</a></dd></div> : null}
                {shown.customer?.phone ? <div><dt>Phone</dt><dd><a href={`tel:${shown.customer.phone}`}>{shown.customer.phone}</a></dd></div> : null}
                {shown.budgetNote ? <div><dt>Their budget</dt><dd>{shown.budgetNote}</dd></div> : null}
                {shown.enquiryRef ? <div><dt>From enquiry</dt><dd>{shown.enquiryRef}</dd></div> : null}
                <div><dt>Price and deposit</dt><dd className="cust-muted">Not set up yet. Quotes and deposits arrive once the studio confirms its pricing.</dd></div>
              </dl>

              {shown.brief ? <section><h3 className="cust-h">Brief</h3><p className="enq-message">{shown.brief}</p></section> : null}

              {canEdit ? (
                <label className="cust-notes"><span className="cust-h">Stage</span>
                  <select value={MOVABLE.includes(shown.status) ? shown.status : ""} onChange={(event) => void move(event.target.value as BookingStatus)}>
                    {!MOVABLE.includes(shown.status) ? <option value="">{STATUS_LABEL[shown.status]}</option> : null}
                    {MOVABLE.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
                  </select>
                </label>
              ) : null}

              <label className="cust-notes"><span className="cust-h">Internal notes</span>
                <textarea rows={4} value={notes} disabled={!canEdit} placeholder="Shot list, logistics, anything the team should know." onChange={(event) => setNotesDraft({ id: shown.id, text: event.target.value })} />
              </label>
              <div className="enq-actions">
                {canEdit ? <button type="button" className="button" disabled={!notesChanged || busy} onClick={() => void saveNotes()}>{saved ? "Saved" : busy ? "Saving…" : "Save notes"}</button> : null}
                {shown.customer?.email ? <a className="button secondary" href={`mailto:${shown.customer.email}?subject=${encodeURIComponent(`${shown.title} (${shown.ref})`)}`}><Icon name="mail" size={14} /> Email client</a> : null}
              </div>
            </article>
          ) : null}
        </div>
      )}
    </div>
  );
}
