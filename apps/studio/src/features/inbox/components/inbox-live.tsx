"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ENTRY_KINDS, fetchInbox, recordMessage, summarise, type PickPerson, type Thread, type ThreadItem } from "../db";

const zone = "Africa/Johannesburg";
const stamp = (iso: string) => new Intl.DateTimeFormat("en-ZA", { timeZone: zone, day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
const short = (iso: string) => new Intl.DateTimeFormat("en-ZA", { timeZone: zone, day: "2-digit", month: "short" }).format(new Date(iso));
const CHANNEL: Record<string, string> = { website: "Website form", email: "Email", phone: "Phone", whatsapp: "WhatsApp", in_person: "In person", other: "Note" };
const who = (item: ThreadItem) => (item.direction === "note" ? "Team note" : item.direction === "out" ? "Sent to them" : "From them");

type Tab = "all" | "needs" | "website";
const TABS: Array<{ id: Tab; label: string }> = [{ id: "all", label: "All" }, { id: "needs", label: "Needs a reply" }, { id: "website", label: "From the website" }];

export function InboxLive({ initial, people, workspaceId }: { initial: Thread[]; people: PickPerson[]; workspaceId: string }) {
  const [threads, setThreads] = useState(initial);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.customerId ?? null);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ customerId: "", kindId: "email-out", subject: "", body: "", occurredAt: "" });

  const counts = useMemo(() => ({
    all: threads.length,
    needs: threads.filter((t) => t.needsReply).length,
    website: threads.filter((t) => t.items.some((i) => i.origin === "form")).length,
  }), [threads]);

  const visible = threads.filter((t) => {
    if (tab === "needs" && !t.needsReply) return false;
    if (tab === "website" && !t.items.some((i) => i.origin === "form")) return false;
    const q = query.trim().toLowerCase();
    return !q || `${t.name} ${t.email ?? ""} ${t.items.map((i) => `${i.subject ?? ""} ${i.body}`).join(" ")}`.toLowerCase().includes(q);
  });
  const selected = threads.find((t) => t.customerId === selectedId) ?? null;
  const shown = selected && visible.some((t) => t.customerId === selected.customerId) ? selected : visible[0] ?? null;

  const openRecorder = (customerId: string) => {
    setForm({ customerId, kindId: "email-out", subject: "", body: "", occurredAt: "" });
    setError(null);
    setRecording(true);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return setError("The studio is not connected to the database.");
    setBusy(true);
    setError(null);
    const result = await recordMessage(supabase, workspaceId, form);
    setBusy(false);
    if ("error" in result) return setError(result.error);
    const person = people.find((p) => p.id === form.customerId);
    setThreads((current) => {
      const existing = current.find((t) => t.customerId === form.customerId);
      const base = existing ? { customerId: existing.customerId, name: existing.name, email: existing.email, items: existing.items } : { customerId: form.customerId, name: person?.name ?? "Customer", email: person?.email ?? null, items: [] as ThreadItem[] };
      // A back-dated entry belongs earlier in the conversation, so the order and the "needs a reply" flag are worked out again.
      const updated: Thread = { ...base, ...summarise([...base.items, result.item]) };
      return [updated, ...current.filter((t) => t.customerId !== form.customerId)].sort((x, y) => y.lastAt.localeCompare(x.lastAt));
    });
    setSelectedId(form.customerId);
    setTab("all");
    setQuery("");
    setRecording(false);
  };

  const refresh = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    try {
      setThreads((await fetchInbox(supabase, workspaceId)).threads);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not refresh.");
    }
    setBusy(false);
  };

  const lastSubject = shown ? [...shown.items].reverse().find((i) => i.subject)?.subject : null;

  return (
    <div className="cat-page enq-page">
      <header className="cat-hero">
        <div>
          <span className="eyebrow">Inbox</span>
          <h1 className="workspace-title">Inbox. <em>Every conversation, in one place.</em></h1>
          <p>Messages from the website forms appear here on their own. Anything you say or hear elsewhere, by email, phone or WhatsApp, you can write down so the whole history stays with the customer.</p>
        </div>
        <div className="enq-head-actions">
          <button type="button" className="button secondary" onClick={() => void refresh()} disabled={busy}><Icon name="refresh" size={14} /> Refresh</button>
          <button type="button" className="button" onClick={() => openRecorder(shown?.customerId ?? "")}><Icon name="plus" size={14} /> Record a message</button>
        </div>
      </header>

      <aside className="cat-notice is-live" role="note">
        <strong>A record, not a mailbox.</strong> Nothing is sent from here and incoming email is not read automatically: sending and receiving email wait until an email service is connected. Entries cannot be edited or removed once saved; correct a mistake by adding a new entry.
      </aside>
      {error ? <div className="cat-error" role="alert">{error}</div> : null}

      <div className="cat-toolbar">
        <div className="workspace-tabs" role="tablist" aria-label="Filter conversations">
          {TABS.map(({ id, label }) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => { setTab(id); setRecording(false); }}>{label} ({counts[id]})</button>)}
        </div>
        <label className="workspace-search cat-search">
          <Icon name="search" size={18} />
          <span className="sr-only">Search conversations</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, email or words in a message" />
        </label>
      </div>

      {threads.length === 0 && !recording ? (
        <div className="cat-empty-box">No conversations yet. They appear here when someone uses a website form, or when you record a message.</div>
      ) : (
        <div className="enq-split">
          <ul className="enq-list" aria-label="Conversations">
            {visible.map((t) => {
              const last = t.items[t.items.length - 1]!;
              return (
                <li key={t.customerId}>
                  <button type="button" className={`enq-row${shown?.customerId === t.customerId && !recording ? " is-selected" : ""}${t.needsReply ? " is-new" : ""}`} onClick={() => { setSelectedId(t.customerId); setRecording(false); }} aria-current={shown?.customerId === t.customerId}>
                    <span className="enq-row-main">
                      <strong>{t.name}</strong>
                      <small className="enq-snippet">{last.direction === "out" ? "You: " : last.direction === "note" ? "Note: " : ""}{last.body}</small>
                    </span>
                    <span className="enq-row-side"><time>{short(t.lastAt)}</time>{t.needsReply ? <span className="workspace-status tone-warning">Needs reply</span> : null}</span>
                  </button>
                </li>
              );
            })}
            {visible.length === 0 ? <li className="cat-empty-box">No conversations in this view.</li> : null}
          </ul>

          {recording ? (
            <form className="cat-card enq-detail" onSubmit={(event) => void save(event)} aria-label="Record a message">
              <header><div><span className="eyebrow">Record</span><h2>Record a message</h2></div></header>
              <div className="cat-fields">
                <label className="wide"><span>Customer</span>
                  <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required>
                    <option value="">Choose a customer</option>
                    {people.map((p) => <option key={p.id} value={p.id}>{p.name}{p.email ? ` · ${p.email}` : ""}</option>)}
                  </select>
                </label>
                <label><span>What happened</span>
                  <select value={form.kindId} onChange={(e) => setForm({ ...form, kindId: e.target.value })}>
                    {ENTRY_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
                  </select>
                </label>
                <label><span>Subject (optional)</span><input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></label>
                <label className="wide"><span>When it happened (optional, leave empty for now)</span><input type="datetime-local" value={form.occurredAt} max={new Date().toISOString().slice(0, 16)} onChange={(e) => setForm({ ...form, occurredAt: e.target.value })} /></label>
                <label className="wide"><span>What was said</span><textarea rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required autoFocus /></label>
              </div>
              <div className="enq-actions">
                <button type="submit" className="button" disabled={busy}>{busy ? "Saving…" : "Save entry"}</button>
                <button type="button" className="button secondary" onClick={() => { setRecording(false); setError(null); }}>Cancel</button>
              </div>
            </form>
          ) : shown ? (
            <article className="cat-card enq-detail" aria-label={`Conversation with ${shown.name}`}>
              <header>
                <div><span className="eyebrow">Conversation</span><h2>{shown.name}</h2>{shown.email ? <small className="cust-muted">{shown.email}</small> : null}</div>
                {shown.needsReply ? <span className="workspace-status tone-warning">Needs reply</span> : null}
              </header>

              <ol className="inb-timeline">
                {shown.items.map((item) => (
                  <li key={`${item.origin}-${item.id}`} className={`inb-msg is-${item.direction}`}>
                    <div className="inb-meta"><strong>{who(item)}</strong><span>{CHANNEL[item.channel]}{item.enquiryRef ? ` · ${item.enquiryRef}` : ""} · {stamp(item.at)}</span></div>
                    {item.subject ? <div className="inb-subject">{item.subject}</div> : null}
                    <p>{item.body}</p>
                  </li>
                ))}
              </ol>

              <div className="enq-actions">
                {shown.email ? <a className="button" href={`mailto:${shown.email}${lastSubject ? `?subject=${encodeURIComponent(`Re: ${lastSubject}`)}` : ""}`}><Icon name="mail" size={14} /> Reply by email</a> : null}
                <button type="button" className="button secondary" onClick={() => openRecorder(shown.customerId)}>Record what you sent or heard</button>
              </div>
            </article>
          ) : null}
        </div>
      )}
    </div>
  );
}
