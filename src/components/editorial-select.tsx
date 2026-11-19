"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * Dropdown in the site's own language: hairline underline trigger, paper panel,
 * uppercase micro-labels and an ink highlight. Replaces the browser's native select list.
 * Keyboard: Up/Down/Home/End to move, Enter/Space to choose, Esc to close, type to jump.
 */
export function EditorialSelect({
  id,
  name,
  options,
  defaultValue,
  label,
}: {
  id: string;
  name: string;
  options: string[];
  defaultValue?: string;
  label: string;
}) {
  const [value, setValue] = useState(defaultValue ?? options[0]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const openList = () => {
    setActive(Math.max(0, options.indexOf(value)));
    setOpen(true);
  };
  const choose = (v: string) => {
    setValue(v);
    setOpen(false);
    root.current?.querySelector("button")?.focus();
  };

  const onKey = (e: KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(options.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(options[active]);
    } else if (e.key.length === 1) {
      const i = options.findIndex((o) => o.toLowerCase().startsWith(e.key.toLowerCase()));
      if (i >= 0) setActive(i);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={root} className="relative" onKeyDown={onKey}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        id={id}
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : openList())}
        className={cn("field flex items-center justify-between gap-4 text-left", open && "border-b-2 pb-[12px]")}
      >
        <span>{value}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          aria-hidden="true"
          className={cn("shrink-0 transition-transform duration-300", open && "rotate-180")}
        >
          <path d="M1.5 4 6 8.5 10.5 4" />
        </svg>
      </button>

      <ul
        id={listId}
        role="listbox"
        aria-label={label}
        className={cn(
          "absolute inset-x-0 top-full z-30 border border-ink bg-paper shadow-[0_18px_40px_-18px_rgba(0,0,0,0.35)] transition-[opacity,transform] duration-200",
          open ? "visible translate-y-0 opacity-100" : "pointer-events-none invisible -translate-y-1 opacity-0",
        )}
      >
        {options.map((o, i) => (
          <li
            key={o}
            role="option"
            aria-selected={o === value}
            onMouseEnter={() => setActive(i)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => choose(o)}
            className={cn(
              "flex cursor-pointer items-center justify-between gap-4 border-b border-line px-4 py-3.5 text-[11px] tracking-[0.08em] uppercase transition-colors last:border-b-0",
              i === active ? "bg-ink text-paper" : "text-ink",
            )}
          >
            <span>{o}</span>
            {o === value && <span aria-hidden="true">●</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
