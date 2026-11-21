"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { CrudRecordDialog, DeleteConfirmDialog, type CrudField, type CrudValues } from "@/components/shared/crud-dialogs";
import type { WorkspaceConfig, WorkspaceRow } from "../types";

const activity = [
  ["Today, 10:24", "Studio Manager", "Record reviewed and details confirmed."],
  ["18 Nov, 16:08", "System", "Status updated from the connected workflow."],
  ["14 Nov, 09:32", "Studio Manager", "Client communication added to this record."],
];

function RecordOverview({ record, config }: { record: WorkspaceRow; config: WorkspaceConfig }) {
  const detail = record.detail;
  return <div className="full-record-overview">
    <div className="full-record-main">
      <section className="full-record-card"><div className="detail-section-head"><div><span>Primary information</span><h2>{config.entity === "customers" ? "Customer profile" : "Record details"}</h2></div><Icon name="file" size={18}/></div><dl>{detail.facts.map((fact)=><div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl></section>
      {detail.description || detail.secondaryFacts ? <section className="full-record-card"><div className="detail-section-head"><div><span>Context</span><h2>{detail.secondaryTitle ?? "Overview"}</h2></div><Icon name="layers" size={18}/></div>{detail.description?<p className="record-description">{detail.description}</p>:null}<dl>{detail.secondaryFacts?.map((fact)=><div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>{detail.tags?<div className="record-tags">{detail.tags.map((tag)=><span key={tag}>{tag}</span>)}</div>:null}</section>:null}
      {detail.progress?<section className="full-record-card full-progress"><div className="detail-section-head"><div><span>Workflow</span><h2>Progress & milestones</h2></div><span>{detail.progress.current + 1} of {detail.progress.steps.length}</span></div><ol>{detail.progress.steps.map((step,index)=><li className={index<=detail.progress!.current?"is-complete":""} key={step}><i>{index<detail.progress!.current?"✓":String(index+1).padStart(2,"0")}</i><span><strong>{step}</strong><small>{index<=detail.progress!.current?"Completed or active":"Upcoming"}</small></span></li>)}</ol></section>:null}
      {detail.editionRun?<section className="full-record-card"><div className="detail-section-head"><div><span>Inventory</span><h2>Edition register</h2></div><span>{detail.editionRun.total} total</span></div><div className="edition-number-grid">{Array.from({length:detail.editionRun.total},(_,index)=><span key={index} className={index<detail.editionRun!.sold?"is-sold":""}>{String(index+1).padStart(2,"0")}</span>)}</div><div className="edition-legend"><span><i className="sold"/> Sold ({detail.editionRun.sold})</span><span><i/> Available ({detail.editionRun.total-detail.editionRun.sold})</span></div></section>:null}
    </div>
    <aside className="full-record-aside"><section className="full-record-card"><div className="detail-section-head"><div><span>Recent</span><h2>Activity</h2></div><button type="button"><Icon name="plus" size={15}/></button></div><div className="activity-stream">{activity.map(([date,author,text])=><div key={date}><i/><time>{date}</time><strong>{author}</strong><p>{text}</p></div>)}</div></section><section className="full-record-card"><div className="detail-section-head"><div><span>Relationships</span><h2>Linked records</h2></div></div>{["Customer profile","Primary invoice","Latest conversation"].map((item,index)=><button type="button" className="linked-record" key={item}><Icon name={index===0?"user":index===1?"file":"mail"} size={16}/><span><strong>{item}</strong><small>Open related workspace</small></span><Icon name="chevron" size={14}/></button>)}</section></aside>
  </div>;
}

function RelatedWorkspace({ label, record }: { label: string; record: WorkspaceRow }) {
  const [items,setItems]=useState([{id:"01",title:`${label} · ${record.title}`,meta:"Updated today",status:"Current"},{id:"02",title:`Earlier ${label.toLowerCase()} entry`,meta:"14 Nov 2026 · Studio Manager",status:"Complete"}]);
  const [selected,setSelected]=useState("01");
  return <section className="full-related"><header><div><span>Linked to {record.id}</span><h2>{label}</h2><p>All {label.toLowerCase()} associated with this record.</p></div><button className="button" type="button" onClick={()=>{const id=String(items.length+1).padStart(2,"0");setItems((current)=>[{id,title:`New ${label.toLowerCase()} entry`,meta:"Created just now",status:"Draft"},...current]);setSelected(id)}}><Icon name="plus" size={14}/> Add {label.replace(/\s*\(.*/,"")}</button></header><div className="full-related-grid"><div className="related-table">{items.map((item)=><button key={item.id} type="button" className={selected===item.id?"is-selected":""} onClick={()=>setSelected(item.id)}><span className="tabnum">{item.id}</span><span><strong>{item.title}</strong><small>{item.meta}</small></span><b>{item.status}</b><Icon name="chevron" size={14}/></button>)}</div><article><span>Selected entry</span><h3>{items.find((item)=>item.id===selected)?.title}</h3><p>This purpose-built record view keeps the full history, files, actions and related information in one place. Changes made here remain local to the prototype.</p><div><button type="button" className="button secondary"><Icon name="pencil" size={14}/> Edit entry</button><button type="button" className="button secondary"><Icon name="trash" size={14}/> Delete</button></div></article></div></section>;
}

export function RecordDetailPage({ config, initialRecord }: { config: WorkspaceConfig; initialRecord: WorkspaceRow }) {
  const router=useRouter();
  const [record,setRecord]=useState(initialRecord);
  const [activeTab,setActiveTab]=useState(0);
  const [editOpen,setEditOpen]=useState(false);
  const [deleteOpen,setDeleteOpen]=useState(false);
  const [notice,setNotice]=useState<string|null>(null);
  const fields=useMemo<CrudField[]>(()=>[{key:"title",label:"Record title"},{key:"subtitle",label:"Supporting detail"},{key:"status",label:"Status"},{key:"bucket",label:"Type / category"},...config.columns.map((column)=>({key:`cell:${column.key}`,label:column.label}))],[config]);
  const initialValues=Object.fromEntries(fields.map((field)=>field.key.startsWith("cell:")?[field.key,record.cells[field.key.slice(5)]??""]:[field.key,String(record[field.key as keyof WorkspaceRow]??"")])) as CrudValues;
  const save=(values:CrudValues)=>{setRecord((current)=>({...current,title:values.title||current.title,subtitle:values.subtitle||current.subtitle,status:values.status||current.status,bucket:values.bucket||current.bucket,cells:Object.fromEntries(config.columns.map((column)=>[column.key,values[`cell:${column.key}`]||current.cells[column.key]||"—"]))}));setEditOpen(false);setNotice("Record changes saved in this prototype session.")};
  return <div className="full-record-page">
    <nav className="record-breadcrumb"><Link href={`/${config.entity}`}><Icon name="arrow-left" size={14}/> Back to {config.eyebrow}</Link><span>/</span><b>{record.id}</b></nav>
    <header className="full-record-hero"><div className="full-record-art"><Image src={record.image??"/artwork-placeholders/dune.svg"} alt="Sample monochrome artwork" fill sizes="220px" unoptimized/></div><div className="full-record-title"><span>{config.eyebrow.slice(0,-1)} · {record.id}</span><h1>{record.title}</h1><p>{record.subtitle}</p><div><b className={`workspace-status tone-${record.tone??"neutral"}`}>{record.status}</b><span>Last updated 18 Nov 2026 · Studio Manager</span></div></div><div className="full-record-actions"><button type="button" className="button secondary" onClick={()=>setEditOpen(true)}><Icon name="pencil" size={14}/> Edit record</button><button type="button" className="button secondary danger" onClick={()=>setDeleteOpen(true)}><Icon name="trash" size={14}/> Delete</button></div></header>
    <section className="full-record-metrics">{record.detail.metrics.map((metric)=><div key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>Current record</small></div>)}</section>
    <div className="full-record-tabs" role="tablist">{config.detailTabs.map((tab,index)=><button type="button" role="tab" aria-selected={index===activeTab} key={tab} onClick={()=>setActiveTab(index)}>{tab}</button>)}</div>
    {activeTab===0?<RecordOverview record={record} config={config}/>:<RelatedWorkspace key={config.detailTabs[activeTab]} label={config.detailTabs[activeTab]??"Related"} record={record}/>} 
    {editOpen?<CrudRecordDialog mode="edit" entity={config.entity} fields={fields} initialValues={initialValues} onClose={()=>setEditOpen(false)} onSave={save}/>:null}
    {deleteOpen?<DeleteConfirmDialog entityLabel={config.entity.slice(0,-1)} recordLabel={record.title} onCancel={()=>setDeleteOpen(false)} onConfirm={()=>router.push(`/${config.entity}`)}/>:null}
    {notice?<div className="demo-toast"><strong>Record updated</strong><span>{notice}</span><button type="button" onClick={()=>setNotice(null)}>×</button></div>:null}
  </div>;
}
