"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { SearchDialog } from "@/components/shared/search-dialog";
import type { NavCounts } from "@/lib/navigation";
import { FloatingSidebar } from "./floating-sidebar";
import { Topbar } from "./topbar";

const SIDEBAR_STORAGE_KEY = "lgndry-sidebar-collapsed";
const SIDEBAR_STORAGE_EVENT = "lgndry-sidebar-storage";

function subscribeToSidebar(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(SIDEBAR_STORAGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SIDEBAR_STORAGE_EVENT, callback);
  };
}

function getSidebarSnapshot() {
  return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
}

/** Client shell: owns the mobile drawer and the search dialog state. */
export function StudioShell({
  children,
  counts,
  demo,
  dateLabel,
  storefrontUrl,
}: {
  children: ReactNode;
  counts: NavCounts;
  demo: boolean;
  dateLabel: string;
  storefrontUrl: string;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const sidebarCollapsed = useSyncExternalStore(subscribeToSidebar, getSidebarSnapshot, () => false);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLButtonElement | null>(null);

  const closeNav = useCallback(() => {
    setNavOpen(false);
  }, []);

  // Ctrl/Cmd + K opens search; Escape closes the drawer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setNavOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Mobile drawer: lock page scroll, move focus in, and give it back on close.
  useEffect(() => {
    if (!navOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebarRef.current?.querySelector<HTMLElement>("a")?.focus();
    const menu = menuRef.current;
    return () => {
      document.body.style.overflow = previous;
      menu?.focus();
    };
  }, [navOpen]);

  const toggleSidebar = () => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(!sidebarCollapsed));
    window.dispatchEvent(new Event(SIDEBAR_STORAGE_EVENT));
  };

  return (
    <>
      <a href="#workspace" className="sr-only">
        Skip to content
      </a>
      <div className={`mobile-backdrop${navOpen ? " open" : ""}`} onClick={closeNav} aria-hidden="true" />
      <div className={`app${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
        <FloatingSidebar open={navOpen} onClose={closeNav} counts={counts} demo={demo} sidebarRef={sidebarRef} collapsed={sidebarCollapsed && !navOpen} onToggleCollapsed={toggleSidebar} />
        <div className="main-shell">
          <Topbar
            onMenu={() => setNavOpen(true)}
            onSearch={() => setSearchOpen(true)}
            navOpen={navOpen}
            menuRef={menuRef}
            dateLabel={dateLabel}
            demo={demo}
            storefrontUrl={storefrontUrl}
          />
          <main className="workspace" id="workspace" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
