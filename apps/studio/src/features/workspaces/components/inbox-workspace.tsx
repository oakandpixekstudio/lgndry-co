"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";

const threads = [
  ["Michael Sinder", "Limited Edition Availability", "I’d like to know if Edition II is still available…", "Enquiry", "18 Nov"],
  ["Amanda Dlamini", "Studio Shoot Request", "Could we reserve a portrait session in November?", "Booking", "17 Nov"],
  ["Thandiwe Mokoena", "Framing options", "Thank you for sharing the museum-grade options.", "Edition", "17 Nov"],
  ["James Carter", "Order ORD-2026-0414", "Please confirm the delivery address on file.", "Order", "16 Nov"],
  ["Naledi Khumalo", "Commission enquiry", "The proposed direction feels exactly right.", "Enquiry", "15 Nov"],
  ["David Rensburg", "Salt & Stone", "We’d like to proceed with two framed pieces.", "Edition", "14 Nov"],
  ["Elena Moretti", "Exhibition collaboration", "Attached is the revised exhibition timeline.", "General", "12 Nov"],
  ["Kabelo Maseko", "Event coverage", "Thank you for the availability update.", "Booking", "11 Nov"],
] as const;

export function InboxWorkspace() {
  const [selected, setSelected] = useState(0);
  const [composeOpen, setComposeOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const selectedThread = threads[selected] ?? threads[0];

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
          <div className="inbox-column-title"><strong>Mailboxes</strong><button type="button" onClick={() => demoNotice("Mailbox creation is disabled in demo mode.")}><Icon name="plus" size={15} /></button></div>
          {["All messages  428", "Unread  12", "Starred  8", "Snoozed  4", "Archive", "Trash"].map((item, index) => <button key={item} type="button" className={index === 0 ? "active" : ""} onClick={() => index !== 0 && demoNotice(`${item.trim()} is a preview filter.`)}>{item}</button>)}
          <div className="inbox-column-title categories"><strong>Categories</strong></div>
          {["Enquiry  41", "Order  9", "Booking  14", "Edition  8", "Client support  6", "General  17"].map((item) => <button key={item} type="button" onClick={() => demoNotice(`${item.trim()} is a preview filter.`)}><i />{item}</button>)}
          <div className="connection-note"><strong>Inbound sync not connected</strong><span>Showing fictional demo conversations only.</span></div>
        </aside>

        <section className="thread-list" aria-label="Conversation list">
          <div className="inbox-list-tools"><label><Icon name="search" size={16} /><input placeholder="Search conversations…" aria-label="Search conversations" /></label><button type="button" onClick={() => demoNotice("Conversation filters are a demo preview.")}><Icon name="sliders" size={16} /></button></div>
          {threads.map((thread, index) => <button type="button" className={`thread-row${selected === index ? " is-selected" : ""}`} key={thread[0] + thread[1]} onClick={() => setSelected(index)}><span className="thread-avatar">{thread[0].split(" ").map((part) => part[0]).join("")}</span><span className="thread-copy"><strong>{thread[0]}</strong><b>{thread[1]}</b><small>{thread[2]}</small></span><span className="thread-meta"><time>{thread[4]}</time><i>{thread[3]}</i></span></button>)}
          <footer className="workspace-list-footer"><span>Showing 1–8 of 428 messages</span><div><button type="button" className="active">1</button><button type="button">2</button><button type="button">3</button><span>…</span><button type="button">54</button></div></footer>
        </section>

        <article className="message-reader">
          <header><div><span className="workspace-status tone-success">{selectedThread[3]}</span><h2>{selectedThread[1]}</h2><p>From: {selectedThread[0]} &lt;m.sinder@coastline.co.za&gt;</p></div><div className="reader-actions"><button type="button" onClick={() => demoNotice("Starred locally for this preview.")}>☆</button><button type="button" onClick={() => setComposeOpen(true)}>↩</button><button type="button" onClick={() => demoNotice("Archive is disabled in demo mode.")}>□</button></div></header>
          <div className="message-body"><div className="message-date">Tue, 18 Nov 2026 at 10:24</div><p>Hi team,</p><p>I’d like to know if Edition II of <em>A Quiet Form</em> is still available, and what the lead time is for a framed piece (60 × 90 cm). Could you also confirm the total cost including framing and delivery to Cape Town?</p><p>Kind regards,<br/><strong>{selectedThread[0]}</strong><br/>Coastline Advisory</p></div>
          <div className="message-attachment"><Icon name="file" size={20}/><span><strong>Framing-Reference.pdf</strong><small>1.2 MB · Demo attachment</small></span></div>
          <button type="button" className="message-reply-box" onClick={() => setComposeOpen(true)}>Reply to {selectedThread[0]}…</button>
        </article>
      </div>

      {composeOpen ? <div className="compose-scrim" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setComposeOpen(false)}><section className="compose-dialog" role="dialog" aria-modal="true" aria-labelledby="compose-title"><header><Icon name="mail" size={28}/><div><h2 id="compose-title">Compose Reply</h2><p>Reply to {selectedThread[0]} · {selectedThread[1]}</p></div><button ref={closeRef} type="button" onClick={() => setComposeOpen(false)} aria-label="Close composer"><Icon name="close" size={20}/></button></header><div className="compose-layout"><aside><strong>Templates</strong>{["Enquiry Response", "Quote / Pricing", "Edition Availability", "Booking Confirmation", "Order Update", "Delivery & Logistics"].map((template, index) => <button type="button" key={template} className={index === 0 ? "active" : ""}>{template}</button>)}</aside><div className="compose-form"><label><span>To</span><input value={`${selectedThread[0]} <m.sinder@coastline.co.za>`} readOnly /></label><label><span>Subject</span><input value={`Re: ${selectedThread[1]}`} readOnly /></label><div className="compose-tools"><b>B</b><i>I</i><u>U</u><span>⌁</span><span>☷</span><span>❝</span></div><textarea defaultValue={`Hi ${selectedThread[0].split(" ")[0]},\n\nThank you for your enquiry.\n\nEdition II of A Quiet Form is still available (8 prints remaining). The total cost for a framed piece (60 × 90 cm) is R 7,800, including museum-grade framing, production and delivery to Cape Town.\n\nThe current lead time is 10–14 business days from payment confirmation.\n\nPlease let me know if you’d like us to prepare a formal quote or reserve a print for you.\n\nKind regards,\nLGNDRY.CO\nStudio Desk`} /><footer><span>Demo draft — nothing will be sent.</span><button type="button" className="button secondary" onClick={() => { setComposeOpen(false); demoNotice("Draft closed without saving. No message was sent."); }}>Save draft</button><button type="button" className="button" onClick={() => { setComposeOpen(false); demoNotice("Send is disabled in demo mode. No message was queued or sent."); }}><Icon name="arrow" size={14}/> Send reply</button></footer></div></div></section></div> : null}
      {notice ? <div className="demo-toast" role="status"><strong>Demo workspace</strong><span>{notice}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">×</button></div> : null}
    </div>
  );
}

