"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { CrudRecordDialog, DeleteConfirmDialog, type CrudValues } from "@/components/shared/crud-dialogs";
import { readEmailSignature, saveEmailSignature } from "@/features/email-signature";

const groups: Array<{ label: string; items: Array<[string, IconName]> }> = [
  { label: "Workspace", items: [["General","sliders"],["Brand & Appearance","image"],["Users & Access","users"],["Roles & Permissions","user"],["Team","users"]] },
  { label: "Operations", items: [["Editions & Products","box"],["Bookings & Calendar","calendar"],["Orders & Invoices","file"],["Payments","bars"],["Taxes & Compliance","circle-check"]] },
  { label: "Communications", items: [["Email","mail"],["Templates","file"],["Automations","refresh"],["Notifications","alert"]] },
  { label: "Integrations", items: [["Connected Apps","layers"],["API Access","trend"],["Webhooks","external"]] },
];

type SettingRecord = { id: string; title: string; value: string; status: string };
const baseRecords: SettingRecord[] = [
  { id: "SET-01", title: "Primary configuration", value: "Enabled", status: "Active" },
  { id: "SET-02", title: "Studio default", value: "LGNDRY.Co", status: "Active" },
  { id: "SET-03", title: "Review requirement", value: "Administrator approval", status: "Needs review" },
];
const initialForm = { studioName: "LGNDRY Co", legalName: "LGNDRY Creative (Pty) Ltd", email: "studio@lgndry.co.za", phone: "+27 11 456 7890", website: "https://www.lgndry.co.za", primary: "#0B3D91", secondary: "#5B7DB3", accent: "#E6EFFD" };

function EmailSettings({ onNotice }: { onNotice: (text: string) => void }) {
  const [signature, setSignature] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setSignature(readEmailSignature()), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const uploadSignature = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      setSignature(value);
      saveEmailSignature(value);
      onNotice("Global email signature updated. It will appear in every new email and reply.");
    };
    reader.readAsDataURL(file);
  };

  return <div className="purpose-settings email-settings-grid">
    <section className="purpose-card"><header><div><span>Sending identity</span><h3>Studio email</h3><p>Configure the address and identity used for client communication.</p></div></header>{[["From name","LGNDRY Studio Desk"],["From address","studio@lgndry.co.za"],["Reply-to address","studio@lgndry.co.za"]].map(([label,value])=><label className="purpose-field" key={label}><span>{label}</span><input defaultValue={value}/></label>)}<button className="button" type="button" onClick={()=>onNotice("Test email queued locally.")}>Send test email</button></section>
    <section className="purpose-card email-signature-card"><header><div><span>Global signature</span><h3>Email signature</h3><p>Upload one signature image and apply it automatically to every new email and reply.</p></div></header><div className={`signature-stage${signature ? " has-signature" : ""}`}>{signature ? <Image src={signature} alt="Current global email signature" width={520} height={150} unoptimized/> : <><Icon name="image" size={28}/><strong>No signature uploaded</strong><span>PNG, JPG, WEBP or AVIF · recommended 1000 × 300 px</span></>}</div><footer><label className="button secondary signature-upload"><Icon name="image" size={14}/>{signature ? "Replace signature" : "Upload signature"}<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={(event)=>uploadSignature(event.target.files?.[0])}/></label><span>{signature ? "Active on all outgoing email" : "Not yet configured"}</span></footer></section>
    <section className="purpose-card email-domain-card"><header><div><span>Delivery health</span><h3>Domain status</h3></div></header>{[["SPF record","Verified"],["DKIM signature","Verified"],["DMARC policy","Monitoring"]].map(([label,status])=><div className="health-row" key={label}><Icon name="circle-check" size={17}/><span><strong>{label}</strong><small>lgndry.co.za</small></span><b>{status}</b></div>)}</section>
  </div>;
}

function PurposeSettings({ active, records, onEdit, onDelete, onNotice }: { active: string; records: SettingRecord[]; onEdit: (id:string)=>void; onDelete:(id:string)=>void; onNotice:(text:string)=>void }) {
  const toggle = (label:string) => <button type="button" className="setting-switch on" role="switch" aria-checked="true" onClick={(event)=>event.currentTarget.classList.toggle("on")}><i/><span className="sr-only">Toggle {label}</span></button>;
  if (active === "Brand & Appearance") return <div className="purpose-settings brand-purpose"><section className="purpose-card brand-canvas"><header><div><span>Identity system</span><h3>Brand application</h3><p>Control how LGNDRY appears across the Studio Desk, documents and client touchpoints.</p></div><button className="button secondary" type="button" onClick={()=>onNotice("Brand asset picker opened in this prototype session.")}>Replace logo</button></header><div className="brand-stage"><b>LGNDRY<small>.Co</small></b><span>STUDIO DESK / COMMERCE</span></div></section><div className="purpose-columns"><section className="purpose-card"><header><div><span>Colour system</span><h3>Studio palette</h3></div></header>{[["Ink","#141413"],["Paper","#F6F4ED"],["Studio blue","#0B3D91"],["Signal green","#DCEBD4"]].map(([name,value])=><label className="colour-row" key={name}><i style={{background:value}}/><span><b>{name}</b><small>{value}</small></span><input defaultValue={value}/></label>)}</section><section className="purpose-card typography-preview"><header><div><span>Typography</span><h3>Editorial hierarchy</h3></div></header><h4>The Intelligence <em>Center.</em></h4><p>Display sans for operational clarity, editorial serif for the studio voice.</p><label>Interface scale<input type="range" min="90" max="110" defaultValue="100"/></label></section></div></div>;
  if (active === "Users & Access") return <div className="purpose-settings"><div className="purpose-stat-row"><div><span>Active users</span><strong>8</strong><small>2 administrators</small></div><div><span>Invitations</span><strong>2</strong><small>Awaiting response</small></div><div><span>Last sign-in</span><strong>8m</strong><small>Studio Manager</small></div></div><section className="purpose-card"><header><div><span>Workspace access</span><h3>People with access</h3><p>Invite colleagues, adjust access, and review account status.</p></div><button className="button" type="button" onClick={()=>onNotice("User invitation composer opened.")}><Icon name="plus" size={14}/> Invite user</button></header><div className="people-table">{[["LS","Lebo Sefolo","Studio Manager","Administrator","Active"],["NM","Nandi Mokoena","Commerce Lead","Editor","Active"],["AK","Ari Khan","Production Coordinator","Operations","Active"],["TR","Tara Reed","External Accountant","Finance","Invited"]].map((user)=><div key={user[1]}><i>{user[0]}</i><span><strong>{user[1]}</strong><small>{user[2]}</small></span><b>{user[3]}</b><em>{user[4]}</em><button type="button" onClick={()=>onNotice(`${user[1]} access options opened.`)}>•••</button></div>)}</div></section></div>;
  if (active === "Roles & Permissions") return <div className="purpose-settings"><section className="purpose-card"><header><div><span>Access model</span><h3>Roles & permission matrix</h3><p>Define what each role can view, create, update, delete and export.</p></div><button className="button" type="button" onClick={()=>onNotice("New role composer opened.")}><Icon name="plus" size={14}/> Create role</button></header><div className="permission-matrix"><div><b>Capability</b>{["Admin","Editor","Operations","Finance"].map((item)=><b key={item}>{item}</b>)}</div>{["Customers & enquiries","Orders & editions","Bookings & production","Invoices & payments","Workspace settings"].map((row,index)=><div key={row}><strong>{row}</strong>{[0,1,2,3].map((column)=><button type="button" key={column} className={column===0||column+index<4?"allowed":""} aria-label={`Toggle ${row} permission`}>{column===0||column+index<4?"✓":"—"}</button>)}</div>)}</div></section></div>;
  if (active === "Team") return <div className="purpose-settings"><section className="purpose-card"><header><div><span>Studio operations</span><h3>Team availability</h3><p>See workload, focus areas and upcoming assignments.</p></div><button className="button secondary" type="button" onClick={()=>onNotice("Team schedule opened.")}>Open schedule</button></header><div className="team-board">{[["LS","Lebo Sefolo","Studio Manager","72%",3],["NM","Nandi Mokoena","Commerce Lead","54%",2],["AK","Ari Khan","Production","86%",5]].map(([initials,name,role,load,jobs])=><article key={String(name)}><div><i>{initials}</i><span><strong>{name}</strong><small>{role}</small></span><b>{load} allocated</b></div><progress value={Number(String(load).replace("%",""))} max="100"/><footer><span>{jobs} active assignments</span><button type="button" onClick={()=>onNotice(`${name} profile opened.`)}>View profile →</button></footer></article>)}</div></section></div>;
  if (["Email","Templates","Automations","Notifications"].includes(active)) {
    if (active === "Email") return <EmailSettings onNotice={onNotice}/>;
    if (active === "Templates") return <div className="purpose-settings"><section className="purpose-card"><header><div><span>Communications library</span><h3>Email templates</h3><p>Reusable studio responses with distinct content and trigger contexts.</p></div><button className="button" type="button" onClick={()=>onNotice("Template editor opened.")}><Icon name="plus" size={14}/> New template</button></header><div className="template-gallery">{[["Enquiry response","First response","mail"],["Edition availability","Sales","image"],["Booking confirmation","Bookings","calendar"],["Order update","Fulfilment","truck"]].map(([title,type,icon])=><article key={title}><Icon name={icon as IconName} size={22}/><span><b>{type}</b><strong>{title}</strong><small>Updated 18 Nov 2026</small></span><button type="button" onClick={()=>onNotice(`${title} editor opened.`)}>Edit →</button></article>)}</div></section></div>;
    if (active === "Automations") return <div className="purpose-settings"><section className="purpose-card"><header><div><span>Workflow engine</span><h3>Active automations</h3><p>Trigger consistent actions when key studio events happen.</p></div><button className="button" type="button" onClick={()=>onNotice("Automation builder opened.")}><Icon name="plus" size={14}/> Build automation</button></header><div className="automation-list">{[["New enquiry acknowledgement","Enquiry received","Send email · assign owner"],["Booking reminder","24 hours before shoot","Send client reminder"],["Payment follow-up","Invoice becomes overdue","Notify finance · send email"]].map(([title,trigger,action])=><article key={title}><Icon name="bolt" size={18}/><span><strong>{title}</strong><small>WHEN {trigger} → {action}</small></span>{toggle(title ?? "Automation")}</article>)}</div></section></div>;
    return <div className="purpose-settings purpose-columns"><section className="purpose-card"><header><div><span>In-app notifications</span><h3>Operational alerts</h3></div></header>{["New enquiries","Order status changes","Booking requests","Overdue invoices","Low edition stock"].map((item)=><div className="channel-row" key={item}><span><strong>{item}</strong><small>Notify administrators and record owners</small></span>{toggle(item)}</div>)}</section><section className="purpose-card"><header><div><span>Delivery channels</span><h3>Where alerts appear</h3></div></header>{["Studio Desk","Email digest","Browser push"].map((item,index)=><div className="channel-row" key={item}><span><strong>{item}</strong><small>{index===0?"Immediate":"Grouped every 30 minutes"}</small></span>{toggle(item)}</div>)}</section></div>;
  }
  if (["Connected Apps","API Access","Webhooks"].includes(active)) {
    if (active === "Connected Apps") return <div className="purpose-settings"><section className="purpose-card"><header><div><span>Integrations</span><h3>Connected services</h3><p>Prototype connections are represented visually; no external service is contacted.</p></div></header><div className="integration-grid">{[["Stripe","Payments","Connected"],["Google Calendar","Bookings","Connected"],["Mailchimp","Campaigns","Available"],["Xero","Accounting","Available"]].map(([name,type,status])=><article key={name}><i>{(name ?? "App").slice(0,2).toUpperCase()}</i><span><strong>{name}</strong><small>{type}</small></span><button type="button" onClick={()=>onNotice(`${name} ${status==="Connected"?"settings":"connection"} opened.`)}>{status}</button></article>)}</div></section></div>;
    if (active === "API Access") return <div className="purpose-settings purpose-columns"><section className="purpose-card"><header><div><span>Developer access</span><h3>API keys</h3><p>Keys are masked and fictional in this interface prototype.</p></div><button className="button" type="button" onClick={()=>onNotice("New API key generated for this prototype session.")}><Icon name="plus" size={14}/> Generate key</button></header><div className="api-key"><span><strong>Studio production</strong><small>Created 12 Oct 2026</small></span><code>lg_live_••••••••••••8A2F</code><button type="button">Copy</button></div></section><section className="purpose-card"><header><div><span>Usage</span><h3>API health</h3></div></header><div className="api-meter"><strong>2,418</strong><span>requests this month</span><progress value="24" max="100"/><small>24% of monthly prototype allocation</small></div></section></div>;
    return <div className="purpose-settings"><section className="purpose-card"><header><div><span>Event delivery</span><h3>Webhook endpoints</h3><p>Send Studio Desk events to trusted external endpoints.</p></div><button className="button" type="button" onClick={()=>onNotice("Webhook endpoint editor opened.")}><Icon name="plus" size={14}/> Add endpoint</button></header><div className="webhook-table">{[["Production workflow","https://studio.example/hooks/orders","order.updated","Healthy"],["Finance sync","https://finance.example/lgndry","invoice.paid","Paused"]].map((row)=><div key={row[0]}><span><strong>{row[0]}</strong><small>{row[1]}</small></span><code>{row[2]}</code><b>{row[3]}</b><button type="button" onClick={()=>onNotice(`${row[0]} webhook editor opened.`)}>Edit</button></div>)}</div></section></div>;
  }
  const labels:Record<string,[string,string,string[]]>={"Editions & Products":["Edition operations","Inventory and production defaults",["Reserve stock during checkout","Flag low edition inventory","Require proof approval"]],"Bookings & Calendar":["Booking operations","Scheduling and availability",["Accept online booking requests","Prevent calendar conflicts","Send 24-hour reminders"]],"Orders & Invoices":["Commerce operations","Order and billing workflow",["Create invoice with paid orders","Require fulfilment checklist","Allow partial payments"]],"Payments":["Payment configuration","Settlement and collection",["Accept EFT payments","Enable payment references","Send payment receipts"]],"Taxes & Compliance":["Compliance controls","Tax and studio records",["Apply 15% VAT","Store consent history","Require invoice addresses"]]};
  const [eyebrow,title,options]=labels[active]??[active,`${active} configuration`,["Enable workflow","Require review","Send notifications"]];
  return <div className="purpose-settings"><div className="purpose-columns"><section className="purpose-card"><header><div><span>{eyebrow}</span><h3>{title}</h3><p>Purpose-built controls for the {active.toLowerCase()} workflow.</p></div></header>{options.map((item)=><div className="channel-row" key={item}><span><strong>{item}</strong><small>Applies to new records and future workflow activity.</small></span>{toggle(item)}</div>)}</section><section className="purpose-card"><header><div><span>Defaults</span><h3>Operational preferences</h3></div></header>{[["Default owner","Studio Manager"],["Review cadence","Weekly"],["Escalation window","48 hours"]].map(([label,value])=><label className="purpose-field" key={label}><span>{label}</span><select defaultValue={value}><option>{value}</option><option>Not assigned</option></select></label>)}</section></div><section className="settings-records compact-records"><div className="settings-record-head"><span>Workflow record</span><span>Current value</span><span>Status</span><span>Actions</span></div>{records.map((record)=><div className="settings-record-row" key={record.id}><span><strong>{record.title}</strong><small>{record.id}</small></span><span>{record.value}</span><span className="workspace-status">{record.status}</span><span><button type="button" onClick={()=>onEdit(record.id)}><Icon name="pencil" size={14}/></button><button type="button" onClick={()=>onDelete(record.id)}><Icon name="trash" size={14}/></button></span></div>)}</section></div>;
}

export function SettingsDashboard() {
  const [active, setActive] = useState("General");
  const [form, setForm] = useState(initialForm);
  const [savedForm, setSavedForm] = useState(initialForm);
  const [toggles, setToggles] = useState({ accounts: true, emails: true, notifications: true });
  const [records, setRecords] = useState<Record<string, SettingRecord[]>>({});
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  // One highlight glides to the chosen section instead of snapping (same motion as the main sidebar).
  useLayoutEffect(() => {
    const nav = navRef.current;
    const indicator = indicatorRef.current;
    if (!nav || !indicator) return;
    const place = () => {
      const button = nav.querySelector<HTMLElement>("button.active");
      if (!button) return;
      const navBox = nav.getBoundingClientRect();
      const box = button.getBoundingClientRect();
      indicator.style.width = `${box.width}px`;
      indicator.style.height = `${box.height}px`;
      indicator.style.transform = `translate(${box.left - navBox.left + nav.scrollLeft - nav.clientLeft}px, ${box.top - navBox.top + nav.scrollTop - nav.clientTop}px)`;
      button.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    };
    place();
    indicator.dataset.ready = "true";
    const observer = new ResizeObserver(place);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [active]);
  const currentRecords = records[active] ?? baseRecords;
  const currentRecord = currentRecords.find((record) => record.id === recordId);
  const deleting = currentRecords.find((record) => record.id === deleteId);
  const updateRecords = (next: SettingRecord[]) => setRecords((current) => ({ ...current, [active]: next }));

  const saveRecord = (values: CrudValues) => {
    if (mode === "edit" && currentRecord) updateRecords(currentRecords.map((record) => record.id === currentRecord.id ? { ...record, title: values.title ?? record.title, value: values.value ?? record.value, status: values.status ?? record.status } : record));
    else updateRecords([{ id: `${active}-${currentRecords.length + 1}`, title: values.title ?? "New setting", value: values.value ?? "Not configured", status: values.status ?? "Draft" }, ...currentRecords]);
    setMode(null); setRecordId(null); setNotice(`${active} settings updated in this prototype session.`);
  };

  return <div className="settings-page">
    <header className="workspace-hero settings-hero"><div><div className="eyebrow">Settings</div><h1 className="workspace-title">Settings. <em>Manage your studio, team and platform.</em></h1><p>Configure your studio, users, permissions, automations and workspace preferences.</p></div><figure><Image src="/artwork-placeholders/waves.svg" alt="Sample monochrome artwork" fill sizes="42vw" unoptimized loading="eager"/><figcaption>Sample artwork</figcaption></figure></header>
    <div className="settings-layout">
      <aside className="settings-nav" ref={navRef} aria-label="Settings sections"><span className="settings-nav-indicator" ref={indicatorRef} aria-hidden="true" />{groups.map((group)=><section key={group.label}><strong>{group.label}</strong>{group.items.map(([item,icon])=><button type="button" key={item} className={active===item?"active":""} onClick={()=>setActive(item)}><Icon name={icon} size={16}/><span>{item}</span></button>)}</section>)}</aside>
      <main className="settings-content" key={active}>
        <header className="settings-content-head"><div><h2>{active}</h2><p>{active === "General" ? "Manage your studio’s core settings, branding, and default preferences." : `Configure ${active.toLowerCase()} and maintain its records.`}</p></div>{active!=="General"?<button type="button" className="button" onClick={()=>setMode("create")}><Icon name="plus" size={14}/> Add record</button>:null}</header>
        {active === "General" ? <>
          <div className="settings-cards settings-cards-two">
            <section className="settings-card org-profile"><header><h3>Organisation Profile</h3><p>Your studio&apos;s main information, shown across client communication and documents.</p></header><div className="org-form"><div className="settings-logo">LGNDRY<span>.Co</span></div><div className="settings-field-grid">{[["Studio Name *","studioName"],["Legal Name","legalName"],["Email *","email"],["Phone","phone"],["Website","website"]].map(([label,key])=>{const field=(key??"studioName") as keyof typeof form;return <label key={field} className={field==="website"?"wide":""}><span>{label}</span><input value={form[field]} onChange={(event)=>setForm((current)=>({...current,[field]:event.target.value}))}/></label>})}</div></div></section>
            <section className="settings-card brand-card"><header><h3>Brand Identity</h3><p>Define your studio&apos;s visual identity across the platform.</p></header><div className="brand-colours">{[["Primary Colour","primary"],["Secondary Colour","secondary"],["Accent Colour","accent"]].map(([label,key])=>{const field=(key??"primary") as keyof typeof form;return <label key={field}><span>{label}</span><i style={{background:form[field]}}/><input value={form[field]} onChange={(event)=>setForm((current)=>({...current,[field]:event.target.value}))}/></label>})}</div><div className="brand-previews"><div><span>Logo (Light)</span><b>LGNDRY<small>.Co</small></b></div><div className="dark"><span>Logo (Dark)</span><b>LGNDRY<small>.Co</small></b></div></div></section>
          </div>
          <section className="settings-card preferences-card"><header><h3>Default Preferences</h3><p>Set your studio&apos;s default operational settings.</p></header><div>{[["Timezone","(GMT+02:00) Johannesburg"],["Currency","ZAR – South African Rand (R)"],["Date Format","DD MMM YYYY (e.g. 18 Nov 2026)"],["Time Format","24-hour (e.g. 14:30)"]].map(([label,value])=><label key={label}><span>{label}</span><select defaultValue={value}><option>{value}</option><option>System default</option></select></label>)}</div></section>
          <div className="settings-cards settings-cards-two bottom-settings"><section className="settings-card"><header><h3>Platform Preferences</h3><p>Control key platform behaviours for your studio.</p></header>{[["accounts","Enable client accounts","Allow clients to log in and manage their bookings, orders and editions."],["emails","Send automated emails","Automatically send confirmations, reminders and updates."],["notifications","Show order notifications","Receive in-app and email notifications for new orders and updates."]].map(([key,title,text])=>{const toggleKey=(key??"accounts") as keyof typeof toggles;return <div className="setting-toggle" key={toggleKey}><Icon name={toggleKey==="emails"?"mail":toggleKey==="notifications"?"alert":"layers"} size={18}/><span><strong>{title}</strong><small>{text}</small></span><button type="button" role="switch" aria-label={title} aria-checked={toggles[toggleKey]} className={toggles[toggleKey]?"on":""} onClick={()=>setToggles((current)=>({...current,[toggleKey]:!current[toggleKey]}))}><i/></button></div>})}</section><section className="settings-card quick-links"><header><h3>Quick Links</h3><p>Common configuration and management tasks.</p></header><div>{[["Manage Users","Users & Access"],["Edit Email Templates","Templates"],["Configure Payments","Payments"],["Manage Automations","Automations"],["Connect Integrations","Connected Apps"],["View Activity Log","Roles & Permissions"]].map(([label,target])=><button type="button" key={label} onClick={()=>setActive(target??"General")}>{label}<span>›</span></button>)}</div></section></div>
          <footer className="settings-actions"><button type="button" className="button secondary" onClick={()=>setForm(savedForm)}>Discard Changes</button><button type="button" className="button" onClick={()=>{setSavedForm(form);setNotice("General settings saved in this prototype session.")}}>Save Changes</button></footer>
        </> : <PurposeSettings active={active} records={currentRecords} onEdit={(id)=>{setRecordId(id);setMode("edit")}} onDelete={setDeleteId} onNotice={setNotice}/>} 
      </main>
    </div>
    {mode?<CrudRecordDialog mode={mode} entity="settings" fields={[{key:"title",label:"Setting name"},{key:"value",label:"Value"},{key:"status",label:"Status"}]} initialValues={currentRecord?{title:currentRecord.title,value:currentRecord.value,status:currentRecord.status}:undefined} onClose={()=>{setMode(null);setRecordId(null)}} onSave={saveRecord}/>:null}
    {deleting?<DeleteConfirmDialog entityLabel="setting" recordLabel={deleting.title} onCancel={()=>setDeleteId(null)} onConfirm={()=>{updateRecords(currentRecords.filter((record)=>record.id!==deleting.id));setDeleteId(null);setNotice("Setting deleted from this prototype session.")}}/>:null}
    {notice?<div className="demo-toast" role="status"><strong>Settings updated</strong><span>{notice}</span><button type="button" onClick={()=>setNotice(null)} aria-label="Dismiss">×</button></div>:null}
  </div>;
}
