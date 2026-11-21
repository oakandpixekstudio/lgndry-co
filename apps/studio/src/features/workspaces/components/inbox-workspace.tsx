"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { CrudRecordDialog, DeleteConfirmDialog, type CrudField, type CrudValues } from "@/components/shared/crud-dialogs";

interface ThreadRecord { id: string; sender: string; subject: string; preview: string; category: string; date: string; unread?: boolean; starred?: boolean; snoozed?: boolean; archived?: boolean; deleted?: boolean; body?: string; replies?: string[] }

const initialThreads: ThreadRecord[] = [
  { id: "MSG-0428", sender: "Michael Sinder", subject: "Limited Edition Availability", preview: "I’d like to know if Edition II is still available…", category: "Enquiry", date: "18 Nov", unread: true, starred: true, body: "I’d like to know if Edition II of A Quiet Form is still available, and what the lead time is for a framed piece (60 × 90 cm). Could you also confirm the total cost including framing and delivery to Cape Town?" },
  { id: "MSG-0427", sender: "Amanda Dlamini", subject: "Studio Shoot Request", preview: "Could we reserve a portrait session in November?", category: "Booking", date: "17 Nov", unread: true },
  { id: "MSG-0426", sender: "Thandiwe Mokoena", subject: "Framing options", preview: "Thank you for sharing the museum-grade options.", category: "Edition", date: "17 Nov", starred: true },
  { id: "MSG-0425", sender: "James Carter", subject: "Order ORD-2026-0414", preview: "Please confirm the delivery address on file.", category: "Order", date: "16 Nov" },
  { id: "MSG-0424", sender: "Naledi Khumalo", subject: "Commission enquiry", preview: "The proposed direction feels exactly right.", category: "Enquiry", date: "15 Nov", snoozed: true },
  { id: "MSG-0423", sender: "David Rensburg", subject: "Salt & Stone", preview: "We’d like to proceed with two framed pieces.", category: "Edition", date: "14 Nov", archived: true },
  { id: "MSG-0422", sender: "Elena Moretti", subject: "Exhibition collaboration", preview: "Attached is the revised exhibition timeline.", category: "General", date: "12 Nov", archived: true },
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
  const [activeMailbox, setActiveMailbox] = useState("all");
  const [search, setSearch] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeBody, setComposeBody] = useState("");
  const [composeMaximized, setComposeMaximized] = useState(false);
  const [ccOpen, setCcOpen] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [followUp, setFollowUp] = useState(false);
  const [composeLabel, setComposeLabel] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [crudMode, setCrudMode] = useState<"create" | "edit" | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const nextThreadNumber = useRef(initialThreads.length + 1);
  const filteredThreads = useMemo(() => threadRows.filter((thread) => {
    const mailboxMatch = activeMailbox === "all" ? !thread.deleted && !thread.archived : activeMailbox === "unread" ? thread.unread && !thread.deleted : activeMailbox === "starred" ? thread.starred && !thread.deleted : activeMailbox === "snoozed" ? thread.snoozed && !thread.deleted : activeMailbox === "archive" ? thread.archived && !thread.deleted : activeMailbox === "trash" ? thread.deleted : thread.category.toLowerCase() === activeMailbox;
    const text = `${thread.sender} ${thread.subject} ${thread.preview}`.toLowerCase();
    return mailboxMatch && text.includes(search.trim().toLowerCase());
  }), [activeMailbox, search, threadRows]);
  const selectedThread = filteredThreads.find((thread) => thread.id === selectedId) ?? filteredThreads[0] ?? threadRows.find((thread) => thread.id === selectedId) ?? { id: "", sender: "No conversation selected", subject: "Create a conversation to begin", preview: "", category: "Draft", date: "—" };

  const mailboxCounts = {
    all: threadRows.filter((thread) => !thread.deleted && !thread.archived).length,
    unread: threadRows.filter((thread) => thread.unread && !thread.deleted).length,
    starred: threadRows.filter((thread) => thread.starred && !thread.deleted).length,
    snoozed: threadRows.filter((thread) => thread.snoozed && !thread.deleted).length,
    archive: threadRows.filter((thread) => thread.archived && !thread.deleted).length,
    trash: threadRows.filter((thread) => thread.deleted).length,
  };

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

  const openComposer = () => {
    setComposeBody(`Hi ${selectedThread.sender.split(" ")[0]},\n\nThank you for your message.\n\nEdition II of A Quiet Form is still available (8 prints remaining). The total cost for a framed piece (60 × 90 cm) is R 7,800, including museum-grade framing, production and delivery to Cape Town.\n\nThe current lead time is 10–14 business days from payment confirmation.\n\nPlease let me know if you’d like us to prepare a formal quote or reserve a print for you.\n\nKind regards,\nLGNDRY.CO\nStudio Desk`);
    setComposeOpen(true);
    setAttachments([]);
    setFollowUp(false);
    setComposeLabel(false);
  };

  const patchSelected = (changes: Partial<ThreadRecord>) => {
    if (!selectedThread.id) return;
    setThreadRows((current) => current.map((thread) => thread.id === selectedThread.id ? { ...thread, ...changes } : thread));
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
    patchSelected({ deleted: true, archived: false, snoozed: false });
    setActiveMailbox("trash");
    demoNotice(`${selectedThread.subject} was moved to Trash.`);
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
          {[
            ["all", "All messages", mailboxCounts.all], ["unread", "Unread", mailboxCounts.unread], ["starred", "Starred", mailboxCounts.starred], ["snoozed", "Snoozed", mailboxCounts.snoozed], ["archive", "Archive", mailboxCounts.archive], ["trash", "Trash", mailboxCounts.trash],
          ].map(([key, label, count]) => <button key={key} type="button" className={activeMailbox === key ? "active" : ""} onClick={() => setActiveMailbox(String(key))}><span>{label}</span><b>{count}</b></button>)}
          <div className="inbox-column-title categories"><strong>Categories</strong></div>
          {["Enquiry", "Order", "Booking", "Edition", "Client support", "General"].map((item) => <button key={item} type="button" className={activeMailbox === item.toLowerCase() ? "active" : ""} onClick={() => setActiveMailbox(item.toLowerCase())}><i /><span>{item}</span><b>{threadRows.filter((thread) => thread.category.toLowerCase() === item.toLowerCase() && !thread.deleted).length}</b></button>)}
          <div className="connection-note"><strong>Inbound sync not connected</strong><span>Showing fictional demo conversations only.</span></div>
        </aside>

        <section className="thread-list" aria-label="Conversation list">
          <div className="inbox-list-tools"><label><Icon name="search" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations…" aria-label="Search conversations" /></label><button type="button" onClick={() => setCrudMode("create")} aria-label="Create conversation"><Icon name="plus" size={16} /></button><button type="button" onClick={() => setSearch("")} aria-label="Clear conversation search"><Icon name="sliders" size={16} /></button></div>
          {filteredThreads.map((thread) => <button type="button" className={`thread-row${selectedThread.id === thread.id ? " is-selected" : ""}${thread.unread ? " is-unread" : ""}`} key={thread.id} onClick={() => { setSelectedId(thread.id); setThreadRows((current) => current.map((item) => item.id === thread.id ? { ...item, unread: false } : item)); }}><span className="thread-avatar">{thread.sender.split(" ").map((part) => part[0]).join("")}</span><span className="thread-copy"><strong>{thread.sender}</strong><b>{thread.subject}</b><small>{thread.preview}</small></span><span className="thread-meta"><time>{thread.date}</time><i>{thread.category}</i></span></button>)}
          {filteredThreads.length === 0 ? <div className="workspace-empty">No conversations in this mailbox.</div> : null}
          <footer className="workspace-list-footer"><span>Showing 1–{filteredThreads.length} of {filteredThreads.length} messages</span><div><button type="button" className="active">1</button></div></footer>
        </section>

        <article className="message-reader">
          <header><div><span className="workspace-status tone-success">{selectedThread.category}</span><h2>{selectedThread.subject}</h2><p>From: {selectedThread.sender} &lt;m.sinder@coastline.co.za&gt;</p></div><div className="reader-actions"><button type="button" className={selectedThread.starred ? "is-active" : ""} onClick={() => patchSelected({ starred: !selectedThread.starred })} aria-label={selectedThread.starred ? "Unstar conversation" : "Star conversation"}>☆</button><button type="button" onClick={openComposer} aria-label="Reply">↩</button><button type="button" className={selectedThread.snoozed ? "is-active" : ""} onClick={() => { patchSelected({ snoozed: !selectedThread.snoozed }); demoNotice(selectedThread.snoozed ? "Conversation unsnoozed." : "Conversation snoozed."); }} aria-label="Snooze conversation">◷</button><button type="button" onClick={() => { patchSelected({ archived: true }); setActiveMailbox("archive"); }} aria-label="Archive conversation">□</button><button type="button" onClick={() => setCrudMode("edit")} aria-label="Edit conversation"><Icon name="pencil" size={15} /></button><button type="button" onClick={() => setDeleteOpen(true)} aria-label="Delete conversation"><Icon name="trash" size={15} /></button></div></header>
          <div className="message-body"><div className="message-date">Tue, 18 Nov 2026 at 10:24</div><p>Hi team,</p><p>{selectedThread.body || selectedThread.preview || "This prototype conversation does not have a message body yet."}</p><p>Kind regards,<br/><strong>{selectedThread.sender}</strong><br/>Coastline Advisory</p>{selectedThread.replies?.map((reply, index) => <div className="message-sent-reply" key={`${selectedThread.id}-reply-${index}`}><span>Reply from Studio Desk</span><p>{reply}</p></div>)}</div>
          <div className="message-attachment"><Icon name="file" size={20}/><span><strong>Framing-Reference.pdf</strong><small>1.2 MB · Demo attachment</small></span></div>
          <button type="button" className="message-reply-box" onClick={openComposer}>Reply to {selectedThread.sender}…</button>
        </article>
      </div>

      {composeOpen ? (
        <div className="compose-scrim" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setComposeOpen(false)}>
          <section className={`compose-dialog${composeMaximized ? " is-maximized" : ""}`} role="dialog" aria-modal="true" aria-labelledby="compose-title">
            <header><Icon name="mail" size={28}/><div><h2 id="compose-title">Compose Reply</h2><p>Reply to {selectedThread.sender} <span>·</span> {selectedThread.subject}</p></div><button type="button" onClick={() => setComposeMaximized((current) => !current)} aria-label={composeMaximized ? "Restore composer" : "Maximize composer"}><Icon name="external" size={17}/></button><button ref={closeRef} type="button" onClick={() => setComposeOpen(false)} aria-label="Close composer"><Icon name="close" size={20}/></button></header>
            <div className="compose-layout">
              <aside><strong><Icon name="layers" size={16}/> Templates</strong>{[
                ["Enquiry Response", `Hi ${selectedThread.sender.split(" ")[0]},\n\nThank you for your enquiry. We have received your request and will confirm availability shortly.\n\nKind regards,\nLGNDRY.CO\nStudio Desk`],
                ["Quote / Pricing", `Hi ${selectedThread.sender.split(" ")[0]},\n\nThank you for your interest. The framed edition is R 7,800 including production and delivery.\n\nKind regards,\nLGNDRY.CO\nStudio Desk`],
                ["Edition Availability", composeBody],
                ["Booking Confirmation", `Hi ${selectedThread.sender.split(" ")[0]},\n\nYour studio booking request is confirmed. We will share the production schedule next.\n\nKind regards,\nLGNDRY.CO\nStudio Desk`],
                ["Booking Information", `Hi ${selectedThread.sender.split(" ")[0]},\n\nPlease find the booking information and production notes below.\n\nKind regards,\nLGNDRY.CO\nStudio Desk`],
                ["Order Update", `Hi ${selectedThread.sender.split(" ")[0]},\n\nYour order is progressing and the latest status is available in the Studio Desk.\n\nKind regards,\nLGNDRY.CO\nStudio Desk`],
                ["Delivery & Logistics", `Hi ${selectedThread.sender.split(" ")[0]},\n\nYour delivery is being prepared. Tracking details will follow once the work is collected.\n\nKind regards,\nLGNDRY.CO\nStudio Desk`],
              ].map(([template, body], index) => <button type="button" key={template} className={index === 0 ? "active" : ""} onClick={() => setComposeBody(body ?? "")}><Icon name={index===3?"calendar":index>=5?"truck":"file"} size={15}/><span>{template}</span><Icon name="chevron" size={13}/></button>)}<button type="button" onClick={()=>demoNotice("Custom template creator opened.")}><Icon name="plus" size={15}/><span>Custom Template</span></button></aside>
              <div className="compose-form">
                <label className="recipient-field"><span>To</span><div><b>{selectedThread.sender} &lt;m.sinder@coastline.co.za&gt;</b></div><button type="button" onClick={()=>setCcOpen((current)=>!current)}>Cc</button><button type="button" onClick={()=>setCcOpen(true)}>Bcc</button></label>
                {ccOpen?<label><span>Cc / Bcc</span><input placeholder="Add recipients…" autoFocus/></label>:null}
                <label><span>Subject</span><input value={`Re: ${selectedThread.subject}`} readOnly /></label>
                <div className="compose-tools"><button type="button" onClick={() => setComposeBody((value) => `**${value}**`)}><b>B</b></button><button type="button" onClick={() => setComposeBody((value) => `_${value}_`)}><i>I</i></button><button type="button" onClick={()=>setComposeBody((value)=>`<u>${value}</u>`)}><u>U</u></button><button type="button" onClick={()=>setComposeBody((value)=>`${value}\n[link](https://)`)}>⌁</button><button type="button" onClick={()=>setComposeBody((value)=>`${value}\n• `)}>☷</button><button type="button" onClick={()=>setComposeBody((value)=>`${value}\n1. `)}>≣</button><button type="button" onClick={()=>setComposeBody((value)=>`${value}\n> `)}>❝</button><button type="button" onClick={()=>setComposeBody((value)=>value.replace(/[*_<>]/g,""))}>Tₓ</button><button type="button" className="compose-insert" onClick={()=>setComposeBody((value)=>`${value}\n\n[Inserted studio detail]`)}>Insert⌄</button></div>
                <textarea value={composeBody} onChange={(event) => setComposeBody(event.target.value)} aria-label="Email message" />
                {attachments.length||followUp||composeLabel?<div className="compose-chips">{attachments.map((item)=><button type="button" key={item} onClick={()=>setAttachments([])}><Icon name="file" size={13}/>{item} ×</button>)}{followUp?<button type="button" onClick={()=>setFollowUp(false)}><Icon name="calendar" size={13}/>Follow up · 21 Nov ×</button>:null}{composeLabel?<button type="button" onClick={()=>setComposeLabel(false)}>High Priority ×</button>:null}</div>:null}
                <footer><div><button type="button" className="button secondary" onClick={()=>setAttachments(["Framing-Reference.pdf"])}><Icon name="file" size={14}/> Attach files</button><button type="button" className="button secondary" onClick={()=>setFollowUp((current)=>!current)}><Icon name="calendar" size={14}/> Add follow up⌄</button><button type="button" className="button secondary" onClick={()=>setComposeLabel((current)=>!current)}><Icon name="star" size={14}/> Add label⌄</button></div><span/><button type="button" className="button secondary save-draft" onClick={() => { setComposeOpen(false); demoNotice("Draft saved in this prototype session."); }}>Save draft</button><button type="button" className="button" onClick={() => { patchSelected({ replies: [...(selectedThread.replies ?? []), composeBody], unread: false }); setComposeOpen(false); demoNotice("Reply added to the conversation in this prototype session."); }}><Icon name="arrow" size={14}/> Send reply</button></footer>
              </div>
            </div>
          </section>
        </div>
      ) : null}
      {crudMode ? <CrudRecordDialog mode={crudMode} entity="conversations" fields={threadFields} initialValues={crudMode === "edit" ? { sender: selectedThread.sender, subject: selectedThread.subject, preview: selectedThread.preview, category: selectedThread.category, date: selectedThread.date } : undefined} onClose={() => setCrudMode(null)} onSave={saveThread} /> : null}
      {deleteOpen ? <DeleteConfirmDialog entityLabel="conversation" recordLabel={selectedThread.subject} onCancel={() => setDeleteOpen(false)} onConfirm={deleteThread} /> : null}
      {notice ? <div className="demo-toast" role="status"><strong>Demo workspace</strong><span>{notice}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">×</button></div> : null}
    </div>
  );
}

