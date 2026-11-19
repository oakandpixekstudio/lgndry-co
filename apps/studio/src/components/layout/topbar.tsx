"use client";

import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
import { crumbFor } from "@/lib/navigation";

export function Topbar({
  onMenu,
  onSearch,
  navOpen,
  menuRef,
  dateLabel,
  demo,
  storefrontUrl,
}: {
  onMenu: () => void;
  onSearch: () => void;
  navOpen: boolean;
  menuRef: React.RefObject<HTMLButtonElement | null>;
  dateLabel: string;
  demo: boolean;
  storefrontUrl: string;
}) {
  const pathname = usePathname();
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
      <button type="button" className="global-search" onClick={onSearch} aria-label="Search the studio (Ctrl K)">
        <span className="icon-slot">
          <Icon name="search" size={16} />
        </span>
        <span>Search the studio</span>
        <kbd>CTRL K</kbd>
      </button>
      <span className="top-date">{dateLabel}</span>
      {demo ? <span className="top-live">DEMO DATA</span> : null}
      <a className="top-store" href={storefrontUrl} target="_blank" rel="noopener noreferrer">
        LIVE WEBSITE <Icon name="external" size={12} />
      </a>
    </header>
  );
}
