"use client";

import { animateDialogClose } from "@/lib/dialog-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { ALL_NAV } from "@/lib/navigation";

/**
 * Global search. Phase 1 searches workspace destinations only.
 * Record search (customers, orders, artworks, bookings, invoices, threads) arrives with the
 * database in Phase 2 and must be server-side, permission-filtered and paginated.
 */
export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_NAV.filter((n) => !q || n.label.toLowerCase().includes(q) || n.crumb.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const close = () => animateDialogClose(scrimRef.current, onClose);

  const go = (href: string) => {
    onClose();
    setQuery("");
    router.push(href);
  };

  return (
    <div className="dialog-scrim" ref={scrimRef} onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div
        className="search-box"
        role="dialog"
        aria-modal="true"
        aria-label="Search the studio"
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setIndex((i) => Math.min(results.length - 1, i + 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setIndex((i) => Math.max(0, i - 1));
          }
          if (e.key === "Enter" && results[index]) go(results[index].href);
        }}
      >
        <div className="search-top">
          <Icon name="search" size={23} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            placeholder="Search the studio..."
            autoComplete="off"
            aria-label="Search the studio"
          />
          <button type="button" className="close-icon" onClick={close} aria-label="Close search">
            <Icon name="close" size={19} />
          </button>
        </div>
        <div className="search-results" role="listbox" aria-label="Results">
          {results.length ? (
            results.map((n, i) => (
              <button
                key={n.href}
                type="button"
                role="option"
                aria-selected={i === index}
                className="search-result"
                onClick={() => go(n.href)}
                onMouseEnter={() => setIndex(i)}
              >
                <span>
                  <strong>{n.label}</strong>
                  <small>Go to {n.crumb}</small>
                </span>
                <Icon name="chevron" size={15} />
              </button>
            ))
          ) : (
            <p style={{ padding: 25, color: "#6b6b65", fontSize: 12 }}>No matching section.</p>
          )}
        </div>
        <div className="search-hint">Searches workspace sections. Record search arrives with the database &nbsp; / &nbsp; ESC TO CLOSE</div>
      </div>
    </div>
  );
}
