"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { CrudRecordDialog, DeleteConfirmDialog, type CrudValues } from "@/components/shared/crud-dialogs";
import type { Bar, InsightsData } from "../live";

type InsightCard = { id: string; title: string; subtitle: string; kind: "trend" | "channel" | "campaign" | "editions" | "location" | "customers" | "note" };

const initialCards: InsightCard[] = [
  { id: "trend", title: "Revenue Trend", subtitle: "Revenue and orders over time.", kind: "trend" },
  { id: "channel", title: "Revenue by Channel", subtitle: "Share of total revenue.", kind: "channel" },
  { id: "campaign", title: "Campaign Performance", subtitle: "Top campaigns by revenue.", kind: "campaign" },
  { id: "editions", title: "Top Editions", subtitle: "Best performing editions by revenue.", kind: "editions" },
  { id: "location", title: "Audience by Location", subtitle: "Where your customers are coming from.", kind: "location" },
  { id: "customers", title: "Customer Insights", subtitle: "Understand your audience and buying behaviour.", kind: "customers" },
];

const tabs = ["Overview", "Sales", "Customers", "Campaigns", "Bookings", "Revenue", "Reports"];
const metrics = [
  ["Total revenue", "R 486,200", "+41.8%", "layers"], ["Orders", "186", "+32.1%", "box"], ["Bookings", "14", "+27.3%", "calendar"],
  ["New customers", "76", "+12.1%", "users"], ["Conversion rate", "5.8%", "+2.1 pp", "trend"], ["Avg. order value", "R 2,614", "+7.4%", "bars"],
] as const;


/** The same chart shells as the sample dashboard, drawn from real counts. Nothing here is a placeholder figure. */
const SHADES = ["#111", "#5c5b56", "#9c998f", "#cdcac2", "#e4e2db"];
const shortWeek = (label: string) => label.replace("Week of ", "");

function LiveContent({ kind, data }: { kind: InsightCard["kind"]; data: InsightsData }) {
  const none = (text: string) => <p className="ov-empty">{text}</p>;
  const bars = (items: Bar[], empty: string) => {
    const max = Math.max(...items.map((item) => item.value), 0);
    if (max === 0) return none(empty);
    return <div className="performance-list" data-reveal="grow">{items.map((item) => <div key={item.label}><span><b>{item.label}</b><strong>{item.value}</strong></span><i><em style={{ width: `${Math.max(item.value > 0 ? 3 : 0, Math.round((item.value / max) * 100))}%` }}/></i></div>)}</div>;
  };

  if (kind === "trend") {
    const weekly = data.enquiries.weekly;
    const values = weekly.map((week) => week.value);
    const max = Math.max(...values, 0);
    if (max === 0) return none("No enquiries in the last 12 weeks yet.");
    const step = values.length > 1 ? 598 / (values.length - 1) : 0;
    const points = values.map((value, index) => [10 + index * step, 180 - (value / max) * 150] as const);
    const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
    const area = `${line} L${points[points.length - 1]![0].toFixed(1)} 180 L10 180Z`;
    return <div className="insight-chart" data-reveal="wipe"><div className="chart-axis"><span>{max}</span><span>{Math.round((max * 2) / 3)}</span><span>{Math.round(max / 3)}</span><span>0</span></div><svg viewBox="0 0 620 190" role="img" aria-label={`Enquiries per week over the last 12 weeks, up to ${max} in a week`}><defs><linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#cdcac2" stopOpacity=".95"/><stop offset="1" stopColor="#cdcac2" stopOpacity=".12"/></linearGradient></defs><path d={area} fill="url(#trend-fill)"/><path d={line} fill="none" stroke="#111" strokeWidth="2.5"/></svg><div className="chart-dates">{[0, 3, 6, 9, weekly.length - 1].map((index) => <span key={index}>{shortWeek(weekly[index]!.label)}</span>)}</div></div>;
  }

  if (kind === "channel") {
    const items = data.enquiries.byCategory;
    const total = items.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return none("No enquiries yet.");
    const shown = items.slice(0, 5);
    const stops = shown.map((item, index) => {
      const from = (shown.slice(0, index).reduce((sum, earlier) => sum + earlier.value, 0) / total) * 100;
      const to = from + (item.value / total) * 100;
      return `${SHADES[index]} ${from.toFixed(1)}% ${to.toFixed(1)}%`;
    });
    return <div className="channel-chart" data-reveal="donut"><div className="donut" style={{ background: `conic-gradient(${stops.join(",")})` }}><span><strong>{total}</strong>Total enquiries</span></div><ul>{items.slice(0, 5).map((item, index) => <li key={item.label}><i style={{ background: SHADES[index] }}/><span>{item.label}</span><strong>{Math.round((item.value / total) * 100)}%</strong></li>)}</ul></div>;
  }

  if (kind === "campaign") return bars(data.subscribers.monthly, "No new subscribers in the last 6 months.");
  if (kind === "editions") return bars([{ label: "Published", value: data.catalogue.published }, { label: "Draft", value: data.catalogue.draft }, { label: "Scheduled", value: data.catalogue.scheduled }, { label: "Retired", value: data.catalogue.retired }], "No works yet.");
  if (kind === "location") return bars(data.bookings.byStatus, "No photography bookings yet.");
  if (kind === "customers") {
    const thisMonth = data.customers.monthly[data.customers.monthly.length - 1]?.value ?? 0;
    return <div className="customer-stats">{[["users", String(data.customers.total), "Total Customers", "In the records"], ["megaphone", String(data.subscribers.total), "Newsletter Subscribers", "Marketing consent"], ["star", String(thisMonth), "New This Month", "Joined this month"]].map(([icon, value, label, note]) => <div key={label}><Icon name={icon as "users"} size={24}/><strong>{value}</strong><span>{label}</span><b>{note}</b></div>)}</div>;
  }
  return null;
}

const liveCards: InsightCard[] = [
  { id: "trend", title: "Enquiry Trend", subtitle: "Enquiries per week, last 12 weeks.", kind: "trend" },
  { id: "channel", title: "What People Ask About", subtitle: "Share of enquiries by topic.", kind: "channel" },
  { id: "campaign", title: "Newsletter Growth", subtitle: "New subscribers per month.", kind: "campaign" },
  { id: "editions", title: "Works on the Website", subtitle: "Works by state.", kind: "editions" },
  { id: "location", title: "Bookings by Stage", subtitle: "Where photography requests stand.", kind: "location" },
  { id: "customers", title: "Customer Insights", subtitle: "Your audience, from your own records.", kind: "customers" },
];

function CardContent({ kind, data }: { kind: InsightCard["kind"]; data?: InsightsData }) {
  if (data) return <LiveContent kind={kind} data={data} />;
  if (kind === "trend") return <div className="insight-chart" data-reveal="wipe"><div className="chart-axis"><span>R 600K</span><span>R 400K</span><span>R 200K</span><span>R 0</span></div><svg viewBox="0 0 620 190" role="img" aria-label="Revenue trend rises from October to November"><defs><linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#cdcac2" stopOpacity=".95"/><stop offset="1" stopColor="#cdcac2" stopOpacity=".12"/></linearGradient></defs><path d="M10 160 C55 126 80 145 120 123 S180 83 230 111 S300 56 350 79 S420 88 460 48 S535 68 608 20 L608 180 L10 180Z" fill="url(#trend-fill)"/><path d="M10 160 C55 126 80 145 120 123 S180 83 230 111 S300 56 350 79 S420 88 460 48 S535 68 608 20" fill="none" stroke="#111" strokeWidth="2.5"/><path d="M10 170 C85 145 120 169 190 135 S280 150 345 115 S420 143 485 98 S550 105 608 83" fill="none" stroke="#8f8c84" strokeWidth="2"/></svg><div className="chart-dates"><span>20 Oct</span><span>28 Oct</span><span>05 Nov</span><span>13 Nov</span><span>17 Nov</span></div></div>;
  if (kind === "channel") return <div className="channel-chart" data-reveal="donut"><div className="donut"><span><strong>R 486,200</strong>Total Revenue</span></div><ul>{[["Email","42%"],["Website","28%"],["Campaign","18%"],["Direct","8%"],["Referral","4%"]].map(([label,value],index)=><li key={label}><i style={{background:["#111","#5c5b56","#9c998f","#cdcac2","#e4e2db"][index]}}/><span>{label}</span><strong>{value}</strong></li>)}</ul></div>;
  if (kind === "campaign") return <div className="performance-list" data-reveal="grow">{[["A Quiet Form — Edition II","R 186,200",84],["Print & Framing Offer","R 92,400",46],["Studio Shoot Availability","R 64,800",34],["Exhibition Invite","R 48,600",27],["New Edition Alert","R 37,200",20]].map(([name,value,width])=><div key={String(name)}><span><b>{name}</b><strong>{value}</strong></span><i><em style={{width:`${width}%`}}/></i></div>)}</div>;
  if (kind === "editions") return <div className="top-editions">{[["A Quiet Form — Edition II","R 186,200","72 orders"],["Salt & Stone — Edition I","R 92,400","36 orders"],["Desert Light — Edition I","R 64,800","24 orders"],["Coastline — Edition I","R 48,600","18 orders"]].map(([name,value,orders],index)=><div key={name}><span className="insight-thumb"><Image src={["/artwork-placeholders/dune.svg","/artwork-placeholders/cliff.svg","/artwork-placeholders/waves.svg"][index%3] ?? "/artwork-placeholders/dune.svg"} alt="" fill unoptimized/></span><strong>{name}</strong><b>{value}</b><small>{orders}</small></div>)}</div>;
  if (kind === "location") return <div className="location-panel" data-reveal="pop"><svg viewBox="0 0 400 190" aria-label="Audience map"><path d="M25 60 65 35l52 9 31-22 42 19 34-8 30 25 68-6 53 40-35 27-31-8-30 24-44-8-24 40-31-22-28 12-25-35-46-10-5-31-51-5Z" fill="#dedede"/><circle cx="235" cy="145" r="8" fill="#111"/><circle cx="80" cy="76" r="5" fill="#8f8c84"/><circle cx="164" cy="64" r="4" fill="#8f8c84"/></svg><ul>{[["South Africa","62%"],["United Kingdom","12%"],["United States","8%"],["Germany","6%"],["Other","12%"]].map(([label,value])=><li key={label}><i/><span>{label}</span><strong>{value}</strong></li>)}</ul></div>;
  if (kind === "customers") return <div className="customer-stats">{[["users","2,846","Total Customers","+9.8%"],["refresh","38%","Returning Customers","+6.1 pp"],["star","R 7,824","Customer Lifetime Value","+14.2%"]].map(([icon,value,label,delta])=><div key={label}><Icon name={icon as "users"} size={24}/><strong>{value}</strong><span>{label}</span><b>{delta}</b></div>)}</div>;
  return <div className="insight-note-card"><span className="caps">Studio insight</span><p>This custom insight was created in the current prototype session.</p></div>;
}

/** Without `live` this is the sample dashboard, as before. With it, every figure is counted from the studio's own records. */
export function InsightsDashboard({ live }: { live?: InsightsData } = {}) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [cards, setCards] = useState(live ? liveCards : initialCards);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const activeCard = cards.find((card) => card.id === activeId);
  const deletingCard = cards.find((card) => card.id === deleteId);

  const saveCard = (values: CrudValues) => {
    if (dialogMode === "edit" && activeCard) setCards((current) => current.map((card) => card.id === activeCard.id ? { ...card, title: values.title ?? card.title, subtitle: values.subtitle ?? card.subtitle } : card));
    else setCards((current) => [...current, { id: `custom-${current.length + 1}`, title: values.title ?? "New insight", subtitle: values.subtitle ?? "Custom studio intelligence.", kind: "note" }]);
    setDialogMode(null); setActiveId(null); setNotice("Insight workspace updated in this prototype session.");
  };

  return <div className="insights-page">
    <header className="workspace-hero insights-hero"><div><div className="eyebrow">Insights</div><h1 className="workspace-title">Insights. <em>Performance, customers and growth.</em></h1><p>{live ? "What is happening across enquiries, customers, bookings and the website, counted from your own records. Sales figures appear once online ordering opens." : "A unified view of your studio's performance across sales, marketing, bookings and clients."}</p></div><figure><Image src="/artwork-placeholders/waves.svg" alt="Sample monochrome artwork" fill sizes="42vw" unoptimized loading="eager"/><figcaption>Sample artwork</figcaption></figure></header>
    <div className="insights-controls"><div className="insights-tabs" role="tablist">{tabs.map((tab)=><button type="button" role="tab" aria-selected={activeTab===tab} key={tab} onClick={()=>setActiveTab(tab)}>{tab}</button>)}</div><div className="insights-filters"><select aria-label="Date range" disabled={Boolean(live)} title={live ? "Date ranges are not available yet" : undefined}><option>{live ? "Recent weeks and months" : "Last 30 Days"}</option><option>Last 90 Days</option><option>This Year</option></select><select aria-label="Channel" disabled={Boolean(live)} title={live ? "Channels are not tracked yet" : undefined}><option>All Channels</option><option>Email</option><option>Website</option></select><button type="button" className="button" disabled={Boolean(live)} title={live ? "Custom insights are not available yet" : undefined} onClick={()=>setDialogMode("create")}><Icon name="plus" size={14}/> New insight</button></div></div>
    <section className="insights-kpis" aria-label={`${activeTab} metrics`}>{(live ? ([
      ["Enquiries (90 days)", String(live.enquiries.total90d), "Through the website", "mail"], ["Customers", String(live.customers.total), "In the records", "users"], ["Newsletter subscribers", String(live.subscribers.total), "Marketing consent", "megaphone"],
      ["Bookings", String(live.bookings.total), "Photography requests", "calendar"], ["Works published", String(live.catalogue.published), "On the website", "image"], ["Draft works", String(live.catalogue.draft), "Not yet public", "pencil"],
    ] as const) : metrics).map(([label,value,delta,icon])=><div key={label}><span>{!live && activeTab !== "Overview" ? `${activeTab} ${label}` : label}</span><Icon name={icon} size={20}/><strong>{value}</strong><small>{delta}{live ? null : <> <em>vs. previous period</em></>}</small></div>)}</section>
    <section className="insights-grid">{cards.map((card)=><article className={`insight-card insight-card-${card.kind}`} key={card.id}><header><div><h2>{card.title}</h2><p>{card.subtitle}</p></div>{live ? null : <button type="button" aria-label={`Actions for ${card.title}`} onClick={()=>setMenuId(menuId===card.id?null:card.id)}>•••</button>}{!live && menuId===card.id?<div className="insight-card-menu"><button type="button" onClick={()=>{setActiveId(card.id);setDialogMode("edit");setMenuId(null)}}>Edit insight</button><button type="button" onClick={()=>{setDeleteId(card.id);setMenuId(null)}}>Delete insight</button></div>:null}</header><CardContent kind={card.kind} data={live}/></article>)}</section>
    {dialogMode?<CrudRecordDialog mode={dialogMode} entity="insights" fields={[{key:"title",label:"Insight title"},{key:"subtitle",label:"Description",type:"textarea"}]} initialValues={activeCard?{title:activeCard.title,subtitle:activeCard.subtitle}:undefined} onClose={()=>{setDialogMode(null);setActiveId(null)}} onSave={saveCard}/>:null}
    {deletingCard?<DeleteConfirmDialog entityLabel="insight" recordLabel={deletingCard.title} onCancel={()=>setDeleteId(null)} onConfirm={()=>{setCards((current)=>current.filter((card)=>card.id!==deletingCard.id));setDeleteId(null);setNotice("Insight deleted from this prototype session.")}}/>:null}
    {notice?<div className="demo-toast" role="status"><strong>Insights updated</strong><span>{notice}</span><button type="button" onClick={()=>setNotice(null)} aria-label="Dismiss">×</button></div>:null}
  </div>;
}
