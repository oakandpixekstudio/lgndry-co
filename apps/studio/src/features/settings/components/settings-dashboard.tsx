"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { CrudRecordDialog, DeleteConfirmDialog, type CrudValues } from "@/components/shared/crud-dialogs";

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
      <aside className="settings-nav" aria-label="Settings sections">{groups.map((group)=><section key={group.label}><strong>{group.label}</strong>{group.items.map(([item,icon])=><button type="button" key={item} className={active===item?"active":""} onClick={()=>setActive(item)}><Icon name={icon} size={16}/><span>{item}</span></button>)}</section>)}</aside>
      <main className="settings-content">
        <header className="settings-content-head"><div><h2>{active}</h2><p>{active === "General" ? "Manage your studio’s core settings, branding, and default preferences." : `Configure ${active.toLowerCase()} and maintain its records.`}</p></div>{active!=="General"?<button type="button" className="button" onClick={()=>setMode("create")}><Icon name="plus" size={14}/> Add record</button>:null}</header>
        {active === "General" ? <>
          <div className="settings-cards settings-cards-two">
            <section className="settings-card org-profile"><header><h3>Organisation Profile</h3><p>Your studio&apos;s main information, shown across client communication and documents.</p></header><div className="org-form"><div className="settings-logo">LGNDRY<span>.Co</span></div><div className="settings-field-grid">{[["Studio Name *","studioName"],["Legal Name","legalName"],["Email *","email"],["Phone","phone"],["Website","website"]].map(([label,key])=>{const field=(key??"studioName") as keyof typeof form;return <label key={field} className={field==="website"?"wide":""}><span>{label}</span><input value={form[field]} onChange={(event)=>setForm((current)=>({...current,[field]:event.target.value}))}/></label>})}</div></div></section>
            <section className="settings-card brand-card"><header><h3>Brand Identity</h3><p>Define your studio&apos;s visual identity across the platform.</p></header><div className="brand-colours">{[["Primary Colour","primary"],["Secondary Colour","secondary"],["Accent Colour","accent"]].map(([label,key])=>{const field=(key??"primary") as keyof typeof form;return <label key={field}><span>{label}</span><i style={{background:form[field]}}/><input value={form[field]} onChange={(event)=>setForm((current)=>({...current,[field]:event.target.value}))}/></label>})}</div><div className="brand-previews"><div><span>Logo (Light)</span><b>LGNDRY<small>.Co</small></b></div><div className="dark"><span>Logo (Dark)</span><b>LGNDRY<small>.Co</small></b></div></div></section>
          </div>
          <section className="settings-card preferences-card"><header><h3>Default Preferences</h3><p>Set your studio&apos;s default operational settings.</p></header><div>{[["Timezone","(GMT+02:00) Johannesburg"],["Currency","ZAR – South African Rand (R)"],["Date Format","DD MMM YYYY (e.g. 18 Nov 2026)"],["Time Format","24-hour (e.g. 14:30)"]].map(([label,value])=><label key={label}><span>{label}</span><select defaultValue={value}><option>{value}</option><option>System default</option></select></label>)}</div></section>
          <div className="settings-cards settings-cards-two bottom-settings"><section className="settings-card"><header><h3>Platform Preferences</h3><p>Control key platform behaviours for your studio.</p></header>{[["accounts","Enable client accounts","Allow clients to log in and manage their bookings, orders and editions."],["emails","Send automated emails","Automatically send confirmations, reminders and updates."],["notifications","Show order notifications","Receive in-app and email notifications for new orders and updates."]].map(([key,title,text])=>{const toggleKey=(key??"accounts") as keyof typeof toggles;return <div className="setting-toggle" key={toggleKey}><Icon name={toggleKey==="emails"?"mail":toggleKey==="notifications"?"alert":"layers"} size={18}/><span><strong>{title}</strong><small>{text}</small></span><button type="button" role="switch" aria-checked={toggles[toggleKey]} className={toggles[toggleKey]?"on":""} onClick={()=>setToggles((current)=>({...current,[toggleKey]:!current[toggleKey]}))}><i/></button></div>})}</section><section className="settings-card quick-links"><header><h3>Quick Links</h3><p>Common configuration and management tasks.</p></header><div>{[["Manage Users","Users & Access"],["Edit Email Templates","Templates"],["Configure Payments","Payments"],["Manage Automations","Automations"],["Connect Integrations","Connected Apps"],["View Activity Log","Roles & Permissions"]].map(([label,target])=><button type="button" key={label} onClick={()=>setActive(target??"General")}>{label}<span>›</span></button>)}</div></section></div>
          <footer className="settings-actions"><button type="button" className="button secondary" onClick={()=>setForm(savedForm)}>Discard Changes</button><button type="button" className="button" onClick={()=>{setSavedForm(form);setNotice("General settings saved in this prototype session.")}}>Save Changes</button></footer>
        </> : <section className="settings-records"><div className="settings-record-head"><span>Configuration record</span><span>Current value</span><span>Status</span><span>Actions</span></div>{currentRecords.map((record)=><div className="settings-record-row" key={record.id}><span><strong>{record.title}</strong><small>{record.id}</small></span><span>{record.value}</span><span className="workspace-status">{record.status}</span><span><button type="button" onClick={()=>{setRecordId(record.id);setMode("edit")}} aria-label={`Edit ${record.title}`}><Icon name="pencil" size={14}/></button><button type="button" onClick={()=>setDeleteId(record.id)} aria-label={`Delete ${record.title}`}><Icon name="trash" size={14}/></button></span></div>)}</section>}
      </main>
    </div>
    {mode?<CrudRecordDialog mode={mode} entity="settings" fields={[{key:"title",label:"Setting name"},{key:"value",label:"Value"},{key:"status",label:"Status"}]} initialValues={currentRecord?{title:currentRecord.title,value:currentRecord.value,status:currentRecord.status}:undefined} onClose={()=>{setMode(null);setRecordId(null)}} onSave={saveRecord}/>:null}
    {deleting?<DeleteConfirmDialog entityLabel="setting" recordLabel={deleting.title} onCancel={()=>setDeleteId(null)} onConfirm={()=>{updateRecords(currentRecords.filter((record)=>record.id!==deleting.id));setDeleteId(null);setNotice("Setting deleted from this prototype session.")}}/>:null}
    {notice?<div className="demo-toast" role="status"><strong>Settings updated</strong><span>{notice}</span><button type="button" onClick={()=>setNotice(null)} aria-label="Dismiss">×</button></div>:null}
  </div>;
}
