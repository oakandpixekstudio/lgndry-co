"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animateDialogClose } from "@/lib/dialog-motion";
import { Icon } from "@/components/icons";
import { DeleteConfirmDialog } from "@/components/shared/crud-dialogs";
import { EMAIL_SIGNATURE_EVENT, readEmailSignature } from "@/features/email-signature";

interface ThreadRecord { id: string; sender: string; subject: string; preview: string; category: string; date: string; unread?: boolean; starred?: boolean; snoozed?: boolean; archived?: boolean; deleted?: boolean; body?: string; replies?: string[] }
interface EmailTemplate { id: string; name: string; body: string; icon: "file" | "calendar" | "truck"; custom?: boolean }

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

const initialEmailTemplates: EmailTemplate[] = [
  { id: "enquiry", name: "Enquiry Response", icon: "file", body: "Hi {{first_name}},\n\nThank you for your enquiry. We have received your request and will confirm availability shortly.\n\nKind regards,\nLGNDRY.CO\nStudio Desk" },
  { id: "quote", name: "Quote / Pricing", icon: "file", body: "Hi {{first_name}},\n\nThank you for your interest. The framed edition is R 7,800 including production and delivery.\n\nKind regards,\nLGNDRY.CO\nStudio Desk" },
  { id: "availability", name: "Edition Availability", icon: "file", body: "Hi {{first_name}},\n\nEdition II of A Quiet Form is still available (8 prints remaining).\n\nKind regards,\nLGNDRY.CO\nStudio Desk" },
  { id: "booking-confirmation", name: "Booking Confirmation", icon: "calendar", body: "Hi {{first_name}},\n\nYour studio booking request is confirmed. We will share the production schedule next.\n\nKind regards,\nLGNDRY.CO\nStudio Desk" },
  { id: "booking-information", name: "Booking Information", icon: "calendar", body: "Hi {{first_name}},\n\nPlease find the booking information and production notes below.\n\nKind regards,\nLGNDRY.CO\nStudio Desk" },
  { id: "order-update", name: "Order Update", icon: "truck", body: "Hi {{first_name}},\n\nYour order is progressing and the latest status is available in the Studio Desk.\n\nKind regards,\nLGNDRY.CO\nStudio Desk" },
  { id: "delivery", name: "Delivery & Logistics", icon: "truck", body: "Hi {{first_name}},\n\nYour delivery is being prepared. Tracking details will follow once the work is collected.\n\nKind regards,\nLGNDRY.CO\nStudio Desk" },
];

export function InboxWorkspace() {
  const [threadRows, setThreadRows] = useState<ThreadRecord[]>(initialThreads);
  const [selectedId, setSelectedId] = useState(initialThreads[0]?.id ?? "");
  const [activeMailbox, setActiveMailbox] = useState("all");
  const [search, setSearch] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<"new" | "reply" | "edit">("reply");
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeMaximized, setComposeMaximized] = useState(false);
  const [ccOpen, setCcOpen] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [followUp, setFollowUp] = useState(false);
  const [composeLabel, setComposeLabel] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState("");
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(initialEmailTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState("enquiry");
  const [templateMenuId, setTemplateMenuId] = useState<string | null>(null);
  const [templateEditorMode, setTemplateEditorMode] = useState<"create" | "edit" | null>(null);
  const [templateEditingId, setTemplateEditingId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [templateDeleteId, setTemplateDeleteId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const composeScrimRef = useRef<HTMLDivElement>(null);
  const templateScrimRef = useRef<HTMLDivElement>(null);
  const closeCompose = useCallback(() => animateDialogClose(composeScrimRef.current, () => setComposeOpen(false)), []);
  const closeTemplateEditor = useCallback(() => animateDialogClose(templateScrimRef.current, () => setTemplateEditorMode(null)), []);
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
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && closeCompose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [composeOpen, closeCompose]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSignatureUrl(readEmailSignature()), 0);
    const updateSignature = (event: Event) => setSignatureUrl((event as CustomEvent<string>).detail || readEmailSignature());
    window.addEventListener(EMAIL_SIGNATURE_EVENT, updateSignature);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener(EMAIL_SIGNATURE_EVENT, updateSignature);
    };
  }, []);

  const demoNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 4500);
  };

  const applyTemplate = (template: EmailTemplate) => {
    const firstName = (composeTo.split(" ")[0] || selectedThread.sender.split(" ")[0] || "there").replace(/[<]/g, "");
    setComposeBody(template.body.replaceAll("{{first_name}}", firstName));
    setSelectedTemplateId(template.id);
    setTemplateMenuId(null);
  };

  const openTemplateEditor = (mode: "create" | "edit", template?: EmailTemplate) => {
    setTemplateEditorMode(mode);
    setTemplateEditingId(template?.id ?? null);
    setTemplateName(template?.name ?? "");
    setTemplateBody(template?.body ?? "Hi {{first_name}},\n\n\n\nKind regards,\nLGNDRY.CO\nStudio Desk");
    setTemplateMenuId(null);
  };

  const saveTemplate = () => {
    const name = templateName.trim() || "Untitled Template";
    if (templateEditorMode === "edit" && templateEditingId) {
      setEmailTemplates((current) => current.map((template) => template.id === templateEditingId ? { ...template, name, body: templateBody } : template));
      demoNotice(`${name} template updated.`);
    } else {
      const created: EmailTemplate = { id: `custom-${Date.now()}`, name, body: templateBody, icon: "file", custom: true };
      setEmailTemplates((current) => [...current, created]);
      setSelectedTemplateId(created.id);
      demoNotice(`${name} template created.`);
    }
    setTemplateEditorMode(null);
  };

  const openComposer = (mode: "new" | "reply" | "edit" = "reply") => {
    setComposeMode(mode);
    setComposeTo(mode === "new" ? "" : `${selectedThread.sender} <m.sinder@coastline.co.za>`);
    setComposeSubject(mode === "reply" ? `Re: ${selectedThread.subject}` : mode === "edit" ? selectedThread.subject : "");
    setComposeBody(mode === "new" ? "" : mode === "edit" ? (selectedThread.body || selectedThread.preview || "") : `Hi ${selectedThread.sender.split(" ")[0]},\n\nThank you for your enquiry.\n\nEdition II of A Quiet Form is still available (8 prints remaining). The total cost for a framed piece (60 × 90 cm) is R 7,800, including museum-grade framing, production and delivery to Cape Town.\n\nThe current lead time is 10–14 business days from payment confirmation.\n\nPlease let me know if you’d like us to prepare a formal quote or reserve a print for you.\n\nKind regards,\nLGNDRY.CO\nStudio Desk`);
    setComposeOpen(true);
    setAttachments([]);
    setFollowUp(false);
    setComposeLabel(false);
  };

  const patchSelected = (changes: Partial<ThreadRecord>) => {
    if (!selectedThread.id) return;
    setThreadRows((current) => current.map((thread) => thread.id === selectedThread.id ? { ...thread, ...changes } : thread));
  };

  const submitComposer = () => {
    if (composeMode === "edit" && selectedThread.id) {
      patchSelected({ subject: composeSubject || "Untitled conversation", body: composeBody, preview: composeBody.replace(/\s+/g, " ").slice(0, 74) });
      demoNotice(`${composeSubject || "Email"} was updated in this prototype session.`);
    } else if (composeMode === "new") {
      const sender = composeTo.split("<")[0]?.trim() || composeTo.trim() || "New contact";
      const created: ThreadRecord = { id: `MSG-NEW-${nextThreadNumber.current++}`, sender, subject: composeSubject || "Untitled email", preview: composeBody.replace(/\s+/g, " ").slice(0, 74), body: composeBody, category: "General", date: "Today" };
      setThreadRows((current) => [created, ...current]);
      setSelectedId(created.id);
      setActiveMailbox("all");
      demoNotice(`${created.subject} was added to this prototype session.`);
    } else {
      patchSelected({ replies: [...(selectedThread.replies ?? []), composeBody], unread: false });
      demoNotice("Reply added to the conversation in this prototype session.");
    }
    closeCompose();
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
          <div className="inbox-column-title"><strong>Mailboxes</strong><button type="button" onClick={() => openComposer("new")} aria-label="Compose new email"><Icon name="plus" size={15} /></button></div>
          {[
            ["all", "All messages", mailboxCounts.all], ["unread", "Unread", mailboxCounts.unread], ["starred", "Starred", mailboxCounts.starred], ["snoozed", "Snoozed", mailboxCounts.snoozed], ["archive", "Archive", mailboxCounts.archive], ["trash", "Trash", mailboxCounts.trash],
          ].map(([key, label, count]) => <button key={key} type="button" className={activeMailbox === key ? "active" : ""} onClick={() => setActiveMailbox(String(key))}><span>{label}</span><b>{count}</b></button>)}
          <div className="inbox-column-title categories"><strong>Categories</strong></div>
          {["Enquiry", "Order", "Booking", "Edition", "Client support", "General"].map((item) => <button key={item} type="button" className={activeMailbox === item.toLowerCase() ? "active" : ""} onClick={() => setActiveMailbox(item.toLowerCase())}><i /><span>{item}</span><b>{threadRows.filter((thread) => thread.category.toLowerCase() === item.toLowerCase() && !thread.deleted).length}</b></button>)}
          <div className="connection-note"><strong>Inbound sync not connected</strong><span>Showing fictional demo conversations only.</span></div>
        </aside>

        <section className="thread-list" aria-label="Conversation list">
          <div className="inbox-list-tools"><label><Icon name="search" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations…" aria-label="Search conversations" /></label><button type="button" onClick={() => openComposer("new")} aria-label="Compose new email"><Icon name="plus" size={16} /></button><button type="button" onClick={() => setSearch("")} aria-label="Clear conversation search"><Icon name="sliders" size={16} /></button></div>
          {filteredThreads.map((thread) => <button type="button" className={`thread-row${selectedThread.id === thread.id ? " is-selected" : ""}${thread.unread ? " is-unread" : ""}`} key={thread.id} onClick={() => { setSelectedId(thread.id); setThreadRows((current) => current.map((item) => item.id === thread.id ? { ...item, unread: false } : item)); }}><span className="thread-avatar">{thread.sender.split(" ").map((part) => part[0]).join("")}</span><span className="thread-copy"><strong>{thread.sender}</strong><b>{thread.subject}</b><small>{thread.preview}</small></span><span className="thread-meta"><time>{thread.date}</time><i>{thread.category}</i></span></button>)}
          {filteredThreads.length === 0 ? <div className="workspace-empty">No conversations in this mailbox.</div> : null}
          <footer className="workspace-list-footer"><span>Showing 1–{filteredThreads.length} of {filteredThreads.length} messages</span><div><button type="button" className="active">1</button></div></footer>
        </section>

        <article className="message-reader">
          <header><div><span className="workspace-status tone-success">{selectedThread.category}</span><h2>{selectedThread.subject}</h2><p>From: {selectedThread.sender} &lt;m.sinder@coastline.co.za&gt;</p></div><div className="reader-actions"><button type="button" className={selectedThread.starred ? "is-active" : ""} onClick={() => patchSelected({ starred: !selectedThread.starred })} aria-label={selectedThread.starred ? "Unstar conversation" : "Star conversation"}>☆</button><button type="button" onClick={() => openComposer("reply")} aria-label="Reply">↩</button><button type="button" className={selectedThread.snoozed ? "is-active" : ""} onClick={() => { patchSelected({ snoozed: !selectedThread.snoozed }); demoNotice(selectedThread.snoozed ? "Conversation unsnoozed." : "Conversation snoozed."); }} aria-label="Snooze conversation">◷</button><button type="button" onClick={() => { patchSelected({ archived: true }); setActiveMailbox("archive"); }} aria-label="Archive conversation">□</button><button type="button" onClick={() => openComposer("edit")} aria-label="Edit email"><Icon name="pencil" size={15} /></button><button type="button" onClick={() => setDeleteOpen(true)} aria-label="Delete conversation"><Icon name="trash" size={15} /></button></div></header>
          <div className="message-body"><div className="message-date">Tue, 18 Nov 2026 at 10:24</div><p>Hi team,</p><p>{selectedThread.body || selectedThread.preview || "This prototype conversation does not have a message body yet."}</p><p>Kind regards,<br/><strong>{selectedThread.sender}</strong><br/>Coastline Advisory</p>{selectedThread.replies?.map((reply, index) => <div className="message-sent-reply" key={`${selectedThread.id}-reply-${index}`}><span>Reply from Studio Desk</span><p>{reply}</p></div>)}</div>
          <div className="message-attachment"><Icon name="file" size={20}/><span><strong>Framing-Reference.pdf</strong><small>1.2 MB · Demo attachment</small></span></div>
          <button type="button" className="message-reply-box" onClick={() => openComposer("reply")}>Reply to {selectedThread.sender}…</button>
        </article>
      </div>

      {composeOpen ? (
        <div className="compose-scrim" ref={composeScrimRef} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeCompose()}>
          <section className={`compose-dialog${composeMaximized ? " is-maximized" : ""}`} role="dialog" aria-modal="true" aria-labelledby="compose-title">
            <header><Icon name="mail" size={28}/><div><h2 id="compose-title">{composeMode === "reply" ? "Compose Reply" : composeMode === "edit" ? "Edit Email" : "New Email"}</h2><p>{composeMode === "reply" ? <>Reply to {selectedThread.sender} <span>·</span> {selectedThread.subject}</> : composeMode === "edit" ? <>Editing {selectedThread.subject}</> : <>Compose a new studio email</>}</p></div><button type="button" onClick={() => setComposeMaximized((current) => !current)} aria-label={composeMaximized ? "Restore composer" : "Maximize composer"}><Icon name="external" size={17}/></button><button ref={closeRef} type="button" onClick={() => closeCompose()} aria-label="Close composer"><Icon name="close" size={20}/></button></header>
            <div className="compose-layout">
              <aside><strong><Icon name="layers" size={16}/> Templates</strong>{emailTemplates.map((template) => <div className={`compose-template-row${selectedTemplateId === template.id ? " active" : ""}`} key={template.id}><button type="button" className="template-use" onClick={() => applyTemplate(template)}><Icon name={template.icon} size={15}/><span>{template.name}</span></button><button type="button" className="template-more" aria-label={`${template.name} options`} onClick={()=>setTemplateMenuId((current)=>current===template.id?null:template.id)}>•••</button>{templateMenuId === template.id ? <div className="template-menu"><button type="button" onClick={()=>openTemplateEditor("edit",template)}>Edit template</button><button type="button" onClick={()=>{const copy={...template,id:`custom-${Date.now()}`,name:`${template.name} Copy`,custom:true};setEmailTemplates((current)=>[...current,copy]);setTemplateMenuId(null);demoNotice(`${copy.name} created.`)}}>Duplicate</button>{template.custom?<button type="button" className="danger" onClick={()=>{setTemplateDeleteId(template.id);setTemplateMenuId(null)}}>Delete</button>:null}</div>:null}</div>)}<button type="button" className="custom-template-button" onClick={()=>openTemplateEditor("create")}><Icon name="plus" size={15}/><span>Custom Template</span></button></aside>
              <div className="compose-form">
                <div className="recipient-field"><span>To</span>{composeMode === "reply" ? <div><b>{composeTo}</b></div> : <input aria-label="Email recipient" value={composeTo} onChange={(event)=>setComposeTo(event.target.value)} placeholder="Name <email@example.com>"/>}<button type="button" onClick={()=>setCcOpen((current)=>!current)}>Cc</button><button type="button" onClick={()=>setCcOpen(true)}>Bcc</button></div>
                {ccOpen?<label><span>Cc / Bcc</span><input placeholder="Add recipients…" autoFocus/></label>:null}
                <label><span>Subject</span><input value={composeSubject} onChange={(event)=>setComposeSubject(event.target.value)} readOnly={composeMode === "reply"} /></label>
                <div className="compose-tools"><button type="button" onClick={() => setComposeBody((value) => `**${value}**`)}><b>B</b></button><button type="button" onClick={() => setComposeBody((value) => `_${value}_`)}><i>I</i></button><button type="button" onClick={()=>setComposeBody((value)=>`<u>${value}</u>`)}><u>U</u></button><button type="button" onClick={()=>setComposeBody((value)=>`${value}\n[link](https://)`)}>⌁</button><button type="button" onClick={()=>setComposeBody((value)=>`${value}\n• `)}>☷</button><button type="button" onClick={()=>setComposeBody((value)=>`${value}\n1. `)}>≣</button><button type="button" onClick={()=>setComposeBody((value)=>`${value}\n> `)}>❝</button><button type="button" onClick={()=>setComposeBody((value)=>value.replace(/[*_<>]/g,""))}>Tₓ</button><button type="button" className="compose-insert" onClick={()=>setComposeBody((value)=>`${value}\n\n[Inserted studio detail]`)}>Insert⌄</button></div>
                <textarea value={composeBody} onChange={(event) => setComposeBody(event.target.value)} aria-label="Email message" />
                {signatureUrl ? <div className="compose-signature" aria-label="Global email signature"><span>GLOBAL SIGNATURE</span><Image src={signatureUrl} alt="Global email signature" width={420} height={90} unoptimized/></div> : null}
                {attachments.length||followUp||composeLabel?<div className="compose-chips">{attachments.map((item)=><button type="button" key={item} onClick={()=>setAttachments([])}><Icon name="file" size={13}/>{item} ×</button>)}{followUp?<button type="button" onClick={()=>setFollowUp(false)}><Icon name="calendar" size={13}/>Follow up · 21 Nov ×</button>:null}{composeLabel?<button type="button" onClick={()=>setComposeLabel(false)}>High Priority ×</button>:null}</div>:null}
              </div>
            </div>
            <footer className="compose-footer"><div><button type="button" className="button secondary" onClick={()=>setAttachments(["Framing-Reference.pdf"])}><Icon name="file" size={14}/> Attach files</button><button type="button" className="button secondary" onClick={()=>setFollowUp((current)=>!current)}><Icon name="calendar" size={14}/> Add follow up⌄</button><button type="button" className="button secondary" onClick={()=>setComposeLabel((current)=>!current)}><Icon name="star" size={14}/> Add label⌄</button></div><span/><button type="button" className="button secondary save-draft" onClick={() => { closeCompose(); demoNotice("Draft saved in this prototype session."); }}>Save draft</button><button type="button" className="button" onClick={submitComposer}><Icon name="arrow" size={14}/> {composeMode === "edit" ? "Save changes" : composeMode === "new" ? "Send email" : "Send reply"}</button></footer>
          </section>
        </div>
      ) : null}
      {templateEditorMode ? <div className="template-editor-scrim" ref={templateScrimRef} role="presentation"><section className="template-editor" role="dialog" aria-modal="true" aria-labelledby="template-editor-title"><header><div><span>COMMUNICATIONS LIBRARY</span><h2 id="template-editor-title">{templateEditorMode === "edit" ? "Edit email template" : "Create email template"}</h2><p>Use <code>{"{{first_name}}"}</code> to personalise the recipient greeting.</p></div><button type="button" onClick={closeTemplateEditor} aria-label="Close template editor"><Icon name="close" size={18}/></button></header><label><span>Template name</span><input value={templateName} onChange={(event)=>setTemplateName(event.target.value)} autoFocus/></label><label className="template-body-field"><span>Email content</span><textarea value={templateBody} onChange={(event)=>setTemplateBody(event.target.value)}/></label><footer><button type="button" className="button secondary" onClick={closeTemplateEditor}>Cancel</button><button type="button" className="button" onClick={saveTemplate}>{templateEditorMode === "edit" ? "Save template" : "Create template"}</button></footer></section></div> : null}
      {templateDeleteId ? <DeleteConfirmDialog entityLabel="email template" recordLabel={emailTemplates.find((template)=>template.id===templateDeleteId)?.name ?? "Template"} onCancel={()=>setTemplateDeleteId(null)} onConfirm={()=>{setEmailTemplates((current)=>current.filter((template)=>template.id!==templateDeleteId));setTemplateDeleteId(null);demoNotice("Email template deleted.")}}/> : null}
      {deleteOpen ? <DeleteConfirmDialog entityLabel="conversation" recordLabel={selectedThread.subject} onCancel={() => setDeleteOpen(false)} onConfirm={deleteThread} /> : null}
      {notice ? <div className="demo-toast" role="status"><strong>Demo workspace</strong><span>{notice}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">×</button></div> : null}
    </div>
  );
}

