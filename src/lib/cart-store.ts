import { useSyncExternalStore } from "react";
import { FINISHES, SIZES, getWork, unitPrice, type FinishKey, type SizeKey } from "@/lib/catalogue";

/**
 * Prototype cart: lives in the browser only (localStorage).
 * The brief is explicit that production carts, prices and stock must be validated on the
 * server. This store exists so the UI can be designed and tested end to end.
 */

export interface Line {
  key: string;
  slug: string;
  size: SizeKey;
  finish: FinishKey;
  qty: number;
}

const KEY = "lgndry-cart-v1";
const EMPTY: Line[] = [];
const MAX_QTY = 10;

let lines: Line[] | null = null;
const listeners = new Set<() => void>();

const isLine = (l: unknown): l is Line => {
  if (!l || typeof l !== "object") return false;
  const x = l as Line;
  return (
    typeof x.key === "string" &&
    typeof x.slug === "string" &&
    x.size in SIZES &&
    x.finish in FINISHES &&
    Number.isInteger(x.qty) &&
    x.qty > 0 &&
    !!getWork(x.slug)
  );
};

function load(): Line[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isLine) : [];
  } catch {
    return [];
  }
}

const getSnapshot = () => (lines ??= load());
const getServerSnapshot = () => EMPTY;
const emit = () => listeners.forEach((l) => l());

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      lines = load();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function commit(next: Line[]) {
  lines = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: cart still works for this tab */
  }
  emit();
}

export function addToCart(slug: string, size: SizeKey, finish: FinishKey) {
  const key = `${slug}|${size}|${finish}`;
  const current = getSnapshot();
  const existing = current.find((l) => l.key === key);
  commit(
    existing
      ? current.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, l.qty + 1) } : l))
      : [...current, { key, slug, size, finish, qty: 1 }],
  );
}

export function setQty(key: string, qty: number) {
  const current = getSnapshot();
  commit(
    qty < 1
      ? current.filter((l) => l.key !== key)
      : current.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)),
  );
}

export function removeLine(key: string) {
  commit(getSnapshot().filter((l) => l.key !== key));
}

export function clearCart() {
  commit([]);
}

export function lineTotal(l: Line) {
  const w = getWork(l.slug);
  const p = w ? unitPrice(w, l.size, l.finish) : null;
  return p === null ? 0 : p * l.qty;
}

export function useCart() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const count = current.reduce((s, l) => s + l.qty, 0);
  const subtotal = current.reduce((s, l) => s + lineTotal(l), 0);
  return { lines: current, count, subtotal };
}
