"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { bellItems, type Attention, type AttentionKind } from "@/features/notifications/attention";
import { crumbFor } from "@/lib/navigation";

const BELL_ICON: Record<AttentionKind, IconName> = { enquiry: "mail", booking: "calendar", shoot: "camera" };
const BELL_TONE: Record<AttentionKind, string> = { enquiry: "tone-warning", booking: "tone-warning", shoot: "tone-success" };

export function Topbar({
  onMenu,
  onSearch,
  navOpen,
  menuRef,
  dateLabel,
  storefrontUrl,
  demo = false,
  attention = null,
  live = false,
}: {
  /** Real things waiting for attention (signed in). */
  attention?: Attention | null;
  /** Signed in with a staff role: show real notifications instead of the sample ones. */
  live?: boolean;
  onMenu: () => void;
  onSearch: () => void;
  navOpen: boolean;
  menuRef: React.RefObject<HTMLButtonElement | null>;
  dateLabel: string;
  storefrontUrl: string;
  demo?: boolean;
}) {
  const pathname = usePathname();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!notificationsRef.current?.contains(event.target as Node)) setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  return (
    <header className="topbar">
      <button
        type="button"
        className="menu-toggle"
        ref={menuRef}
        onClick={onMenu}
        aria-label="Open navigation"
        aria-expanded={navOpen}
        aria-controls="sidebar"
      >
        <Icon name="menu" size={21} />
      </button>
      <div className="topbar-path">
        <span>LGNDRY</span>
        <span className="slash">/</span>
        <span className="muted">{crumbFor(pathname)}</span>
      </div>
      <div className="top-spacer" />
      {demo ? <span className="top-live" title="Sample data only. Nothing here is a real customer, order or payment.">DEMO DATA</span> : null}
      <button type="button" className="global-search" onClick={onSearch} aria-label="Search the studio (Ctrl K)">
        <span className="icon-slot">
          <Icon name="search" size={16} />
        </span>
        <span>Search the studio</span>
        <kbd>CTRL K</kbd>
      </button>
      <span className="top-date">{dateLabel}</span>
      <div className="notification-control" ref={notificationsRef}>
        <button type="button" className="notification-trigger" aria-label="Open notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((current) => !current)}>
          <Icon name="bell" size={17} />
          {live ? (attention && attention.total > 0 ? <span>{attention.total > 99 ? "99+" : attention.total}</span> : null) : <span>3</span>}
        </button>
        <div className={`notification-popover${notificationsOpen ? " is-open" : ""}`} aria-hidden={!notificationsOpen}>
          <header><div><span>Studio desk</span><h2>Notifications</h2></div><Link href="/notifications" onClick={() => setNotificationsOpen(false)}>View all</Link></header>
          {live ? (
            attention && attention.items.length > 0 ? bellItems(attention.items, 5).map((item) => (
              <Link key={item.id} href={item.href} onClick={() => setNotificationsOpen(false)}><i className={BELL_TONE[item.kind]}><Icon name={BELL_ICON[item.kind]} size={16}/></i><span><strong>{item.title}</strong><small>{item.body} · {item.when}</small></span><b /></Link>
            )) : <p className="bell-empty">{!attention ? "Notifications could not be loaded." : attention.restricted ? "Notifications are for the studio owner and studio managers." : "Nothing needs your attention right now."}</p>
          ) : (
            <>
              <Link href="/orders/ORD-2026-0417" onClick={() => setNotificationsOpen(false)}><i className="tone-info"><Icon name="box" size={16}/></i><span><strong>Order moved into production</strong><small>ORD-2026-0417 · 4 minutes ago</small></span><b /></Link>
              <Link href="/bookings/BK-2026-0417" onClick={() => setNotificationsOpen(false)}><i className="tone-success"><Icon name="calendar" size={16}/></i><span><strong>Booking confirmed</strong><small>Editorial / Coastline · 38 minutes ago</small></span><b /></Link>
              <Link href="/enquiries/ENQ-2026-0417" onClick={() => setNotificationsOpen(false)}><i className="tone-warning"><Icon name="mail" size={16}/></i><span><strong>New high-intent enquiry</strong><small>Limited Edition Availability · 1 hour ago</small></span><b /></Link>
            </>
          )}
          <footer><Link href="/notifications" onClick={() => setNotificationsOpen(false)}>Open notification centre <Icon name="arrow" size={14}/></Link></footer>
        </div>
      </div>
      <a className="top-store" href={storefrontUrl} target="_blank" rel="noopener noreferrer">
        LIVE WEBSITE <Icon name="external" size={12} />
      </a>
    </header>
  );
}
