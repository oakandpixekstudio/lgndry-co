"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { AUDIENCE_LABEL, audienceSize, fetchCampaigns, saveDraft, setDraftArchived, type Audience, type Draft, type Subscriber } from "../db";

const zone = "Africa/Johannesburg";
const day = (iso: string) => new Intl.DateTimeFormat("en-ZA", { timeZone: zone, day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
const empty = { name: "", subject: "", previewText: "", body: "", audience: "all_subscribers" as Audience };

/** What has to be true before a Send button can exist. Shown to the studio so the wait is explained, not hidden. */
const BLOCKERS = [
  "An email service connected (the client's Resend account and a verified sender address)",
  "An approved privacy notice, with its version recorded against each subscriber's consent",
  "An unsubscribe link in every message, and a way to honour it straight away",
  "Approval of each campaign by the studio owner before it can go out",
];

export function CampaignsLive({ initialDrafts, subscribers: initialSubscribers, workspaceId, canEdit }: { initialDrafts: Draft[]; subscribers: Subscriber[]; workspaceId: string; canEdit: boolean }) {
  const [drafts, setDrafts] = useState(initialDrafts);
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialDrafts.find((d) => !d.archived)?.id ?? null);
  const [editing, setEditing] = useState<"new" | "edit" | null>(null);
  // The draft being edited, remembered when Edit is clicked. The one on screen can differ from the one last selected.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const visible = drafts.filter((d) => d.archived === showArchived);
  const selected = drafts.find((d) => d.id === selectedId) ?? null;
  const shown = editing ? null : (selected && visible.some((d) => d.id === selected.id) ? selected : visible[0] ?? null);
  const sizes = useMemo(() => ({ all: audienceSize(subscribers, "all_subscribers"), enquirers: audienceSize(subscribers, "subscribed_enquirers") }), [subscribers]);
  const activeCount = drafts.filter((d) => !d.archived).length;

  const client = () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) setError("The studio is not connected to the database.");
    return supabase;
  };
  const patch = (draft: Draft) => setDrafts((current) => current.map((d) => (d.id === draft.id ? draft : d)));

  const startNew = () => { setForm(empty); setEditingId(null); setEditing("new"); setError(null); };
  const startEdit = (draft: Draft) => { setForm({ name: draft.name, subject: draft.subject, previewText: draft.previewText, body: draft.body, audience: draft.audience }); setEditingId(draft.id); setEditing("edit"); setError(null); };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const supabase = client();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const result = await saveDraft(supabase, workspaceId, editing === "edit" ? editingId : null, form);
    setBusy(false);
    if ("error" in result) return setError(result.error);
    if (editing === "edit") patch(result.draft);
    else setDrafts((current) => [result.draft, ...current]);
    setSelectedId(result.draft.id);
    setShowArchived(false);
    setEditing(null);
    setEditingId(null);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const toggleArchive = async (draft: Draft) => {
    const supabase = client();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const problem = await setDraftArchived(supabase, draft.id, !draft.archived);
    setBusy(false);
    if (problem) return setError(problem);
    patch({ ...draft, archived: !draft.archived });
  };

  const refresh = async () => {
    const supabase = client();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    try {
      const data = await fetchCampaigns(supabase, workspaceId);
      setDrafts(data.drafts);
      setSubscribers(data.subscribers);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not refresh.");
    }
    setBusy(false);
  };

  return (
    <div className="cat-page enq-page">
      <header className="cat-hero">
        <div>
          <span className="eyebrow">Campaigns</span>
          <h1 className="workspace-title">Campaigns. <em>Draft first, send when it is safe.</em></h1>
          <p>Write newsletters and see exactly who would receive them. Drafts stay inside the studio: nothing can be sent from here yet.</p>
        </div>
        <div className="enq-head-actions">
          <button type="button" className="button secondary" onClick={() => void refresh()} disabled={busy}><Icon name="refresh" size={14} /> Refresh</button>
          {canEdit ? <button type="button" className="button" onClick={startNew}><Icon name="plus" size={14} /> New draft</button> : null}
        </div>
      </header>

      <aside className="cat-notice is-live" role="note">
        <div>
          <strong>Sending is switched off.</strong> It stays off until all of these are in place:
          <ul className="cmp-blockers">{BLOCKERS.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </aside>
      {error ? <div className="cat-error" role="alert">{error}</div> : null}

      <section className="cat-stats" aria-label="Audience">
        <div><span>Newsletter subscribers</span><strong>{sizes.all}</strong></div>
        <div><span>Subscribed and enquired</span><strong>{sizes.enquirers}</strong></div>
        <div><span>Drafts</span><strong>{activeCount}</strong></div>
        <div><span>Sent so far</span><strong>0</strong></div>
      </section>

      <div className="cat-toolbar">
        <div className="workspace-tabs" role="tablist" aria-label="Drafts">
          <button type="button" role="tab" aria-selected={!showArchived} onClick={() => { setShowArchived(false); setEditing(null); }}>Drafts ({activeCount})</button>
          <button type="button" role="tab" aria-selected={showArchived} onClick={() => { setShowArchived(true); setEditing(null); }}>Archived ({drafts.length - activeCount})</button>
        </div>
      </div>

      <div className="enq-split">
        <ul className="enq-list" aria-label="Drafts">
          {visible.map((d) => (
            <li key={d.id}>
              <button type="button" className={`enq-row${shown?.id === d.id ? " is-selected" : ""}`} onClick={() => { setSelectedId(d.id); setEditing(null); }} aria-current={shown?.id === d.id}>
                <span className="enq-row-main"><strong>{d.name}</strong><small className="enq-snippet">{d.subject || "No subject yet"}</small><small>Edited {day(d.updatedAt)}</small></span>
                <span className="enq-row-side"><span className="workspace-status tone-neutral">{d.archived ? "Archived" : "Draft"}</span></span>
              </button>
            </li>
          ))}
          {visible.length === 0 ? <li className="cat-empty-box">{showArchived ? "Nothing archived." : `No drafts yet.${canEdit ? " Use New draft to write one." : ""}`}</li> : null}
        </ul>

        {editing ? (
          <form className="cat-card enq-detail" onSubmit={(event) => void save(event)} aria-label="Campaign draft">
            <header><div><span className="eyebrow">{editing === "new" ? "New draft" : "Edit draft"}</span><h2>{editing === "new" ? "Write a draft" : form.name || "Draft"}</h2></div></header>
            <div className="cat-fields">
              <label className="wide"><span>Name (only you see this)</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus /></label>
              <label className="wide"><span>Subject line</span><input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></label>
              <label className="wide"><span>Preview text (shown beside the subject)</span><input value={form.previewText} onChange={(e) => setForm({ ...form, previewText: e.target.value })} /></label>
              <label className="wide"><span>Who it would go to</span>
                <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as Audience })}>
                  {(Object.keys(AUDIENCE_LABEL) as Audience[]).map((a) => <option key={a} value={a}>{AUDIENCE_LABEL[a]} ({audienceSize(subscribers, a)})</option>)}
                </select>
              </label>
              <label className="wide"><span>Message</span><textarea rows={10} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></label>
            </div>
            <div className="enq-actions">
              <button type="submit" className="button" disabled={busy}>{busy ? "Saving…" : "Save draft"}</button>
              <button type="button" className="button secondary" onClick={() => { setEditing(null); setError(null); }}>Cancel</button>
            </div>
          </form>
        ) : shown ? (
          <article className="cat-card enq-detail" aria-label={`Draft ${shown.name}`}>
            <header><div><span className="eyebrow">{shown.archived ? "Archived draft" : "Draft"}</span><h2>{shown.name}</h2></div></header>
            <dl className="enq-facts">
              <div><dt>Would go to</dt><dd>{AUDIENCE_LABEL[shown.audience]} ({audienceSize(subscribers, shown.audience)} {audienceSize(subscribers, shown.audience) === 1 ? "person" : "people"} today)</dd></div>
              <div><dt>Last edited</dt><dd>{day(shown.updatedAt)}</dd></div>
            </dl>
            <section aria-label="Preview" className="cmp-preview">
              <span className="cust-h">Preview as a reader would see it</span>
              <div className="cmp-mail">
                <div className="cmp-subject">{shown.subject || <em>No subject yet</em>}</div>
                {shown.previewText ? <div className="cmp-pre">{shown.previewText}</div> : null}
                <p>{shown.body || "No message yet."}</p>
                <small>Every real send will also carry an unsubscribe link. It is not added to this preview.</small>
              </div>
            </section>
            <div className="enq-actions">
              {canEdit && !shown.archived ? <button type="button" className="button" onClick={() => startEdit(shown)}>Edit draft</button> : null}
              <button type="button" className="button secondary" disabled title="Sending is switched off until the conditions above are met">Send (switched off)</button>
              {canEdit ? <button type="button" className="button secondary" disabled={busy} onClick={() => void toggleArchive(shown)}>{shown.archived ? "Restore draft" : "Archive draft"}</button> : null}
              {saved ? <span className="cust-muted" role="status">Saved</span> : null}
            </div>
          </article>
        ) : null}
      </div>

      <section className="cat-card cmp-audience" aria-label="Current subscribers">
        <header><div><span className="eyebrow">Audience</span><h2>Who is subscribed today</h2></div></header>
        <p className="cust-muted">People who agreed to marketing email on the website and have not unsubscribed. Someone who withdraws consent disappears from this list on their own. Archived customers and customers without an email address are never counted.</p>
        {subscribers.length === 0 ? <p className="cust-muted">No one has subscribed yet.</p> : (
          <ul className="cmp-subs">
            {subscribers.slice(0, 25).map((s) => <li key={s.id}><span><strong>{s.name}</strong><small>{s.email}</small></span><small>since {day(s.since)}{s.hasEnquired ? " · has enquired" : ""}</small></li>)}
          </ul>
        )}
        {subscribers.length > 25 ? <p className="cust-muted">Showing the newest 25 of {subscribers.length}.</p> : null}
      </section>
    </div>
  );
}
