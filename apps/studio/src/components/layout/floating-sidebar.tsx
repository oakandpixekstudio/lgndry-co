"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
import { ADMIN_NAV, PRIMARY_NAV, type NavCounts, type NavItem } from "@/lib/navigation";

function NavLink({ item, count, onNavigate }: { item: NavItem; count?: number; onNavigate: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <Link href={item.href} className="nav-btn" aria-current={active ? "page" : undefined} onClick={onNavigate}>
      <Icon name={item.icon} size={18} />
      <span>{item.label}</span>
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
}: {
  open: boolean;
  onClose: () => void;
  counts: NavCounts;
  demo: boolean;
  sidebarRef: React.RefObject<HTMLElement | null>;
}) {
  return (
    <aside className={`sidebar${open ? " mobile-open" : ""}`} id="sidebar" ref={sidebarRef} aria-label="Studio Desk navigation">
      <div className="brand">
        <span className="brand-logo">
          LGNDRY<span>.Co</span>
        </span>
        <div className="brand-sub">STUDIO DESK &nbsp;/&nbsp; COMMERCE</div>
      </div>
      <div className="nav-caption">CONTROL ROOM &nbsp; / &nbsp; 001</div>
      <nav className="nav-list" aria-label="Primary navigation">
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} count={counts[item.href]} onNavigate={onClose} />
        ))}
      </nav>
      <div className="nav-caption" style={{ marginTop: 29 }}>
        ADMINISTRATION
      </div>
      <nav className="nav-list" aria-label="Administration">
        {ADMIN_NAV.map((item) => (
          <NavLink key={item.href} item={item} count={counts[item.href]} onNavigate={onClose} />
        ))}
      </nav>
      <div className="side-bottom">
        <div className="side-bottom-label">{demo ? "SIGNED IN AS / DEMO" : "SIGNED IN AS"}</div>
        <div className="side-profile">
          <span className="avatar-small" aria-hidden="true">
            LS
          </span>
          <span>
            <strong>Studio Manager</strong>
            <small>LGNDRY.Co / Admin</small>
          </span>
        </div>
        <div className="side-version">{demo ? "DEMO ENVIRONMENT" : "PRODUCTION"} &nbsp; V 2.0</div>
      </div>
    </aside>
  );
}
