"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { DeleteConfirmDialog } from "@/components/shared/crud-dialogs";

type Notice={id:string;title:string;body:string;time:string;category:string;icon:IconName;href:string;unread:boolean};
const seed:Notice[]=[
  {id:"N-1007",title:"Order moved into production",body:"ORD-2026-0417 is now with the fine-art production team.",time:"4 minutes ago",category:"Orders",icon:"box",href:"/orders/ORD-2026-0417",unread:true},
  {id:"N-1006",title:"Booking confirmed",body:"Editorial / Coastline has been confirmed for 20 Nov 2026.",time:"38 minutes ago",category:"Bookings",icon:"calendar",href:"/bookings/BK-2026-0417",unread:true},
  {id:"N-1005",title:"New high-intent enquiry",body:"Michael Sinder asked about A Quiet Form — Edition II.",time:"1 hour ago",category:"Enquiries",icon:"mail",href:"/enquiries/ENQ-2026-0417",unread:true},
  {id:"N-1004",title:"Payment received",body:"R 6,200 was received for invoice INV-2026-0417.",time:"Yesterday",category:"Invoices",icon:"circle-check",href:"/invoices/INV-2026-0417",unread:false},
  {id:"N-1003",title:"Edition inventory updated",body:"A Quiet Form now has 8 prints remaining.",time:"Yesterday",category:"Editions",icon:"image",href:"/editions/ED-0014",unread:false},
];

export function NotificationsPage(){
  const [notices,setNotices]=useState(seed);const [tab,setTab]=useState("All");const [deleteId,setDeleteId]=useState<string|null>(null);
  const filtered=useMemo(()=>notices.filter((notice)=>tab==="All"||(tab==="Unread"?notice.unread:notice.category===tab)),[notices,tab]);
  const deleting=notices.find((notice)=>notice.id===deleteId);
  return <div className="notifications-page"><header className="notifications-heading"><div><div className="eyebrow">Notification centre</div><h1>Notifications. <em>What needs your attention.</em></h1><p>Studio activity, customer signals and operational updates in one focused queue.</p></div><button type="button" className="button secondary" onClick={()=>setNotices((current)=>current.map((item)=>({...item,unread:false})))}><Icon name="circle-check" size={15}/> Mark all as read</button></header>
    <div className="notification-summary"><div><span>Unread</span><strong>{notices.filter((item)=>item.unread).length}</strong><small>Requires review</small></div><div><span>Today</span><strong>3</strong><small>New activity</small></div><div><span>Orders & bookings</span><strong>2</strong><small>Operational updates</small></div><div><span>Customer signals</span><strong>1</strong><small>Follow-up opportunity</small></div></div>
    <div className="notification-tabs" role="tablist">{["All","Unread","Orders","Bookings","Enquiries"].map((item)=><button type="button" role="tab" aria-selected={tab===item} onClick={()=>setTab(item)} key={item}>{item}</button>)}</div>
    <section className="notification-list"><header><span>Activity</span><span>{filtered.length} notifications</span></header>{filtered.map((notice)=><article key={notice.id} className={notice.unread?"is-unread":""}><button type="button" className="notice-read" aria-label={notice.unread?"Mark as read":"Mark as unread"} onClick={()=>setNotices((current)=>current.map((item)=>item.id===notice.id?{...item,unread:!item.unread}:item))}><i/></button><Link href={notice.href}><span className="notice-icon"><Icon name={notice.icon} size={19}/></span><span><b>{notice.category}</b><strong>{notice.title}</strong><p>{notice.body}</p><small>{notice.time} · {notice.id}</small></span><Icon name="chevron" size={17}/></Link><button type="button" className="notice-delete" onClick={()=>setDeleteId(notice.id)} aria-label={`Delete ${notice.title}`}><Icon name="trash" size={15}/></button></article>)}{filtered.length===0?<div className="workspace-empty">Nothing in this view. You are all caught up.</div>:null}</section>
    {deleting?<DeleteConfirmDialog entityLabel="notification" recordLabel={deleting.title} onCancel={()=>setDeleteId(null)} onConfirm={()=>{setNotices((current)=>current.filter((item)=>item.id!==deleting.id));setDeleteId(null)}}/>:null}
  </div>;
}
