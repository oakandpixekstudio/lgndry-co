"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { CrudRecordDialog, DeleteConfirmDialog, type CrudField, type CrudValues } from "@/components/shared/crud-dialogs";

interface ThreadRecord { id: string; sender: string; subject: string; preview: string; category: string; date: string }

const initialThreads: ThreadRecord[] = [
  { id: "MSG-0428", sender: "Michael Sinder", subject: "Limited Edition Availability", preview: "I’d like to know if Edition II is still available…", category: "Enquiry", date: "18 Nov" },
  { id: "MSG-0427", sender: "Amanda Dlamini", subject: "Studio Shoot Request", preview: "Could we reserve a portrait session in November?", category: "Booking", date: "17 Nov" },
  { id: "MSG-0426", sender: "Thandiwe Mokoena", subject: "Framing options", preview: "Thank you for sharing the museum-grade options.", category: "Edition", date: "17 Nov" },
  { id: "MSG-0425", sender: "James Carter", subject: "Order ORD-2026-0414", preview: "Please confirm the delivery address on file.", category: "Order", date: "16 Nov" },
  { id: "MSG-0424", sender: "Naledi Khumalo", subject: "Commission enquiry", preview: "The proposed direction feels exactly right.", category: "Enquiry", date: "15 Nov" },
  { id: "MSG-0423", sender: "David Rensburg", subject: "Salt & Stone", preview: "We’d like to proceed with two framed pieces.", category: "Edition", date: "14 Nov" },
  { id: "MSG-0422", sender: "Elena Moretti", subject: "Exhibition collaboration", preview: "Attached is the revised exhibition timeline.", category: "General", date: "12 Nov" },
  { id: "MSG-0421", sender: "Kabelo Maseko", subject: "Event coverage", preview: "Thank you for the availability update.", category: "Booking", date: "11 Nov" },
];

const threadFields: CrudField[] = [
  { key: "sender", label: "Contact name" },
  { key: "subject", label: "Subject" },
  { key: "category", label: "Category" },
  { key: "date", label: "Date" },
  { key: "preview", label: "Message preview", type: "textarea" },
];

export function InboxWorkspace() {
  const [threadRows, setThreadRows] = useState<ThreadRecord[]>(initialThreads);
  const [selectedId, setSelectedId] = useState(initialThreads[0]?.id ?? "");
  const [composeOpen, setComposeOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [crudMode, setCrudMode] = useState<"create" | "edit" | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const nextThreadNumber = useRef(initialThreads.length + 1);
  const selectedThread = threadRows.find((thread) => thread.id === selectedId) ?? threadRows[0] ?? { id: "", sender: "No conversation selected", subject: "Create a conversation to begin", preview: "", category: "Draft", date: "—" };

  useEffect(() => {
    if (!composeOpen) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setComposeOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [composeOpen]);

  const demoNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 4500);
  };

  const saveThread = (values: CrudValues) => {
    if (crudMode === "edit" && selectedThread.id) {
      setThreadRows((current) => current.map((thread) => thread.id === selectedThread.id ? { ...thread, ...values } as ThreadRecord : thread));
      demoNotice(`${values.subject} was updated in this prototype session.`);
    } else {
      const created: ThreadRecord = { id: `MSG-NEW-${nextThreadNumber.current++}`, sender: values.sender ?? "Unknown contact", subject: values.subject ?? "Untitled conversation", preview: values.preview ?? "", category: values.category || "General", date: values.date || "Today" };
      setThreadRows((current) => [created, ...current]);
      setSelectedId(created.id);
      demoNotice(`${created.subject} was created in this prototype session.`);
    }
    setCrudMode(null);
  };

  const deleteThread = () => {
    if (!selectedThread.id) return;
    const remaining = threadRows.filter((thread) => thread.id !== selectedThread.id);
    setThreadRows(remaining);
    setSelectedId(remaining[0]?.id ?? "");
    demoNotice(`${selectedThread.subject} was deleted from this prototype session.`);
    setDeleteOpen(false);
  };

  return (
    <div className="workspace-page inbox-page">
      <header className="workspace-hero">
        <div><div className="eyebrow">Inbox</div><h1 className="workspace-title">Inbox. <em>Studio communication, in one place.</em></h1><p>Manage client conversations, enquiries, orders, bookings and general studio correspondence.</p></div>
        <figure><Image src="/artwork-placeholders/waves.svg" alt="Sample artwork: abstract monochrome landscape" fill sizes="42vw" unoptimized loading="eager" /><figcaption>Sample artwork</figcaption></figure>
      </header>

      <section className="workspace-intelligence" aria-label="Inbox intelligence">
        <div className="workspace-section-label">Inbox intelligence (30 days)</div>
        <div className="workspace-metric-grid inbox-metrics">
          {[
            ["Total messages", "428", "+16.8%", "mail"], ["Unread", "12", "Needs review", "inbox"], ["Enquiries", "41", "+24.2%", "user"],
            ["Orders & editions", "18", "+38.5%", "layers"], ["Bookings", "14", "+27.3%", "calendar"], ["Avg. response", "1h 26m", "↓32%", "clock"],
          ].map(([label, value, change, icon]) => <div className="workspace-metric" key={label}><div><span>{label}</span><Icon name={icon as "mail"} size={17} /></div><strong>{value}</strong><small className="tone-success">{change}</small></div>)}
        </div>
      </section>

      <div className="inbox-workspace">
        <aside className="mailboxes" aria-label="Mailboxes">
          <div className="inbox-column-title"><strong>Mailboxes</strong><button type="button" onClick={() => setCrudMode("create")} aria-label="Create conversation"><Icon name="plus" size={15} /></button></div>
          {["All messages  428", "Unread  12", "Starred  8", "Snoozed  4", "Archive", "Trash"].map((item, index) => <button key={item} type="button" className={index === 0 ? "active" : ""} onClick={() => index !== 0 && demoNotice(`${item.trim()} is a preview filter.`)}>{item}</button>)}
          <div className="inbox-column-title categories"><strong>Categories</strong></div>
          {["Enquiry  41", "Order  9", "Booking  14", "Edition  8", "Client support  6", "General  17"].map((item) => <button key={item} type="button" onClick={() => demoNotice(`${item.trim()} is a preview filter.`)}><i />{item}</button>)}
          <div className="connection-note"><strong>Inbound sync not connected</strong><span>Showing fictional demo conversations only.</span></div>
        </aside>

        <section className="thread-list" aria-label="Conversation list">
          <div className="inbox-list-tools"><label><Icon name="search" size={16} /><input placeholder="Search conversations…" aria-label="Search conversations" /></label><button type="button" onClick={() => setCrudMode("create")} aria-label="Create conversation"><Icon name="plus" size={16} /></button><button type="button" onClick={() => demoNotice("Conversation filters are a prototype preview.")} aria-label="Filter conversations"><Icon name="sliders" size={16} /></button></div>
          {threadRows.map((thread) => <button type="button" className={`thread-row${selectedId === thread.id ? " is-selected" : ""}`} key={thread.id} onClick={() => setSelectedId(thread.id)}><span className="thread-avatar">{thread.sender.split(" ").map((part) => part[0]).join("")}</span><span className="thread-copy"><strong>{thread.sender}</strong><b>{thread.subject}</b><small>{thread.preview}</small></span><span className="thread-meta"><time>{thread.date}</time><i>{thread.category}</i></span></button>)}
          <footer className="workspace-list-footer"><span>Showing 1–{threadRows.length} of {threadRows.length} messages</span><div><button type="button" className="active">1</button></div></footer>
        </section>

        <article className="message-reader">
          <header><div><span className="workspace-status tone-success">{selectedThread.category}</span><h2>{selectedThread.subject}</h2><p>From: {selectedThread.sender} &lt;m.sinder@coastline.co.za&gt;</p></div><div className="reader-actions"><button type="button" onClick={() => setCrudMode("edit")} aria-label="Edit conversation"><Icon name="pencil" size={15} /></button><button type="button" onClick={() => setComposeOpen(true)} aria-label="Reply">↩</button><button type="button" onClick={() => setDeleteOpen(true)} aria-label="Delete conversation"><Icon name="trash" size={15} /></button></div></header>
          <div className="message-body"><div className="message-date">Tue, 18 Nov 2026 at 10:24</div><p>Hi team,</p><p>{selectedThread.preview || "This prototype conversation does not have a message body yet."}</p><p>Kind regards,<br/><strong>{selectedThread.sender}</strong><br/>Coastline Advisory</p></div>
          <div className="message-attachment"><Icon name="file" size={20}/><span><strong>Framing-Reference.pdf</strong><small>1.2 MB · Demo attachment</small></span></div>
          <button type="button" className="message-reply-box" onClick={() => setComposeOpen(true)}>Reply to {selectedThread.sender}…</button>
        </article>
      </div>

      {composeOpen ? <div className="compose-scrim" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setComposeOpen(false)}><section className="compose-dialog" role="dialog" aria-modal="true" aria-labelledby="compose-title"><header><Icon name="mail" size={28}/><div><h2 id="compose-title">Compose Reply</h2><p>Reply to {selectedThread.sender} · {selectedThread.subject}</p></div><button ref={closeRef} type="button" onClick={() => setComposeOpen(false)} aria-label="Close composer"><Icon name="close" size={20}/></button></header><div className="compose-layout"><aside><strong>Templates</strong>{["Enquiry Response", "Quote / Pricing", "Edition Availability", "Booking Confirmation", "Order Update", "Delivery & Logistics"].map((template, index) => <button type="button" key={template} className={index === 0 ? "active" : ""}>{template}</button>)}</aside><div className="compose-form"><label><span>To</span><input value={`${selectedThread.sender} <m.sinder@coastline.co.za>`} readOnly /></label><label><span>Subject</span><input value={`Re: ${selectedThread.subject}`} readOnly /></label><div className="compose-tools"><b>B</b><i>I</i><u>U</u><span>⌁</span><span>☷</span><span>❝</span></div><textarea defaultValue={`Hi ${selectedThread.sender.split(" ")[0]},\n\nThank you for your enquiry.\n\nEdition II of A Quiet Form is still available (8 prints remaining). The total cost for a framed piece (60 × 90 cm) is R 7,800, including museum-grade framing, production and delivery to Cape Town.\n\nThe current lead time is 10–14 business days from payment confirmation.\n\nPlease let me know if you’d like us to prepare a formal quote or reserve a print for you.\n\nKind regards,\nLGNDRY.CO\nStudio Desk`} /><footer><span>Demo draft — nothing will be sent.</span><button type="button" className="button secondary" onClick={() => { setComposeOpen(false); demoNotice("Draft closed without saving. No message was sent."); }}>Save draft</button><button type="button" className="button" onClick={() => { setComposeOpen(false); demoNotice("Send is disabled in demo mode. No message was queued or sent."); }}><Icon name="arrow" size={14}/> Send reply</button></footer></div></div></section></div> : null}
      {crudMode ? <CrudRecordDialog mode={crudMode} entity="conversations" fields={threadFields} initialValues={crudMode === "edit" ? { sender: selectedThread.sender, subject: selectedThread.subject, preview: selectedThread.preview, category: selectedThread.category, date: selectedThread.date } : undefined} onClose={() => setCrudMode(null)} onSave={saveThread} /> : null}
      {deleteOpen ? <DeleteConfirmDialog entityLabel="conversation" recordLabel={selectedThread.subject} onCancel={() => setDeleteOpen(false)} onConfirm={deleteThread} /> : null}
      {notice ? <div className="demo-toast" role="status"><strong>Demo workspace</strong><span>{notice}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">×</button></div> : null}
    </div>
  );
}

