import { useSyncExternalStore } from "react";
import { seedCatalogue } from "./demo-catalogue";
import type { CatalogueArtwork, CatalogueState, MediaSlot } from "./types";

/**
 * DEMO store: lives in this browser tab only (sessionStorage). Nothing here reaches the website or a database.
 * It exposes the calls the real data layer will provide, so the screens do not change when Supabase is connected.
 */

const KEY = "lgndry-demo-catalogue-v1";
const SERVER_SNAPSHOT = seedCatalogue();
let state: CatalogueState | null = null;
const listeners = new Set<() => void>();

function load(): CatalogueState {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CatalogueState;
      if (Array.isArray(parsed.artworks) && Array.isArray(parsed.slots)) return parsed;
    }
  } catch {
    /* storage blocked or corrupt: fall back to the seed */
  }
  return seedCatalogue();
}

const getSnapshot = () => (state ??= load());
const getServerSnapshot = () => SERVER_SNAPSHOT;
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

function commit(next: CatalogueState) {
  state = next;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota exceeded (large uploads): keep working in memory */
  }
  listeners.forEach((listener) => listener());
}

export const saveArtwork = (artwork: CatalogueArtwork) => {
  const current = getSnapshot();
  const exists = current.artworks.some((item) => item.id === artwork.id);
  commit({ ...current, artworks: exists ? current.artworks.map((item) => (item.id === artwork.id ? artwork : item)) : [artwork, ...current.artworks] });
};

export const deleteArtwork = (id: string) => {
  const current = getSnapshot();
  commit({ ...current, artworks: current.artworks.filter((item) => item.id !== id) });
};

export const saveSlot = (slot: MediaSlot) => {
  const current = getSnapshot();
  commit({ ...current, slots: current.slots.map((item) => (item.key === slot.key ? slot : item)) });
};

export const resetDemoCatalogue = () => commit(seedCatalogue());

export const nextSku = (artworks: CatalogueArtwork[]) => {
  const highest = artworks.reduce((max, item) => Math.max(max, Number(item.sku.replace(/\D/g, "")) || 0), 0);
  return `LGN-${String(highest + 1).padStart(4, "0")}`;
};

export const useCatalogue = () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
