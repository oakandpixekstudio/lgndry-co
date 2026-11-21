"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { ADMIN_NAV, PRIMARY_NAV, type NavCounts, type NavItem } from "@/lib/navigation";

function NavLink({ item, count, active, onSelect }: { item: NavItem; count?: number; active: boolean; onSelect: (href: string) => void }) {
  return (
    <Link href={item.href} className="nav-btn" aria-current={active ? "page" : undefined} onClick={() => onSelect(item.href)}>
      <Icon name={item.icon} size={18} />
      <span className="nav-label">{item.label}</span>
      {count ? (
        <span className="nav-count" aria-label={`${count} need attention`}>
          {count}
        </span>
      ) : null}
    </Link>
  );
}

export function FloatingSidebar({
  open,
  onClose,
  counts,
  demo,
  sidebarRef,
  collapsed,
  onToggleCollapsed,
}: {
  open: boolean;
  onClose: () => void;
  counts: NavCounts;
  demo: boolean;
  sidebarRef: React.RefObject<HTMLElement | null>;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // The highlight moves the instant a link is pressed instead of waiting for the next route to render.
  const [pending, setPending] = useState<{ href: string; from: string } | null>(null);
  const activeHref = pending && pending.from === pathname
    ? pending.href
    : [...PRIMARY_NAV, ...ADMIN_NAV].find((item) => pathname === item.href || pathname.startsWith(item.href + "/"))?.href ?? null;
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  const select = (href: string) => {
    setPending({ href, from: pathname });
    onClose();
  };
  useLayoutEffect(() => {
    const root = sidebarRef.current;
    const indicator = indicatorRef.current;
    if (!root || !indicator) return;
    const place = () => {
      const link = root.querySelector<HTMLElement>(".nav-btn[aria-current=\"page\"]");
      if (!link) {
        indicator.style.opacity = "0";
        return;
      }
      indicator.style.opacity = "1";
      indicator.style.left = `${link.offsetLeft}px`;
      indicator.style.width = `${link.offsetWidth}px`;
      indicator.style.height = `${link.offsetHeight}px`;
      indicator.style.transform = `translateY(${link.offsetTop}px)`;
    };
    place();
    indicator.dataset.ready = "true";
    const observer = new ResizeObserver(place);
    observer.observe(root);
    return () => observer.disconnect();
  }, [activeHref, collapsed, sidebarRef]);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  return (
    <aside className={`sidebar${open ? " mobile-open" : ""}`} id="sidebar" ref={sidebarRef} aria-label="Studio Desk navigation">
      <div className="brand">
        <span className="brand-logo" aria-label="LGNDRY.Co">
          <span className="brand-wordmark" aria-hidden="true">LGNDRY<span className="brand-co">.Co</span></span>
          <span className="brand-monogram" aria-hidden="true">LG</span>
        </span>
        <div className="brand-sub">STUDIO DESK &nbsp;/&nbsp; COMMERCE</div>
        <button type="button" className="sidebar-collapse" onClick={onToggleCollapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-pressed={collapsed}>
          <Icon name="chevron" size={15} />
        </button>
      </div>
      <div className="nav-caption"><span className="nav-caption-full">CONTROL ROOM &nbsp; / &nbsp; 001</span><span className="nav-caption-compact">001</span></div>
      <span className="nav-indicator" ref={indicatorRef} aria-hidden="true" />
      <nav className="nav-list" aria-label="Primary navigation">
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} count={counts[item.href]} active={item.href === activeHref} onSelect={select} />
        ))}
      </nav>
      <div className="nav-caption" style={{ marginTop: 29 }}>
        <span className="nav-caption-full">ADMINISTRATION</span><span className="nav-caption-compact">ADM</span>
      </div>
      <nav className="nav-list" aria-label="Administration">
        {ADMIN_NAV.map((item) => (
          <NavLink key={item.href} item={item} count={counts[item.href]} active={item.href === activeHref} onSelect={select} />
        ))}
      </nav>
      <div className="side-bottom">
        <div className="side-bottom-label">{demo ? "SIGNED IN AS / DEMO" : "SIGNED IN AS"}</div>
        <div className="side-profile-wrap" ref={profileRef}>
        <button type="button" className="side-profile" onClick={() => setProfileOpen((current) => !current)} aria-expanded={profileOpen} aria-label="Open account menu">
          <span className="avatar-small" aria-hidden="true">
            LS
          </span>
          <span className="side-profile-copy">
            <strong>Studio Manager</strong>
            <small>LGNDRY.Co / Admin</small>
          </span>
          <Icon name="chevron" size={13} className="profile-chevron" />
        </button>
        <div className={`profile-menu${profileOpen ? " is-open" : ""}`} aria-hidden={!profileOpen}>
          <div><strong>Studio Manager</strong><span>studio@lgndry.co.za</span></div>
          <Link href="/settings" onClick={() => setProfileOpen(false)}><Icon name="user" size={15}/> Profile & account</Link>
          <Link href="/notifications" onClick={() => setProfileOpen(false)}><Icon name="bell" size={15}/> Notifications</Link>
          <Link href="/settings" onClick={() => setProfileOpen(false)}><Icon name="sliders" size={15}/> Workspace settings</Link>
          <button type="button" onClick={() => router.push("/sign-in")}><Icon name="logout" size={15}/> Sign out</button>
        </div>
        </div>
        <div className="side-version">{demo ? "DEMO ENVIRONMENT" : "PRODUCTION"} &nbsp; V 2.0</div>
      </div>
    </aside>
  );
}
