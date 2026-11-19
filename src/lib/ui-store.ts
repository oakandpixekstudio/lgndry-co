import { useSyncExternalStore } from "react";

/** Tiny shared UI state: bag drawer + toast. No provider needed. */

type Listener = () => void;

function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<Listener>();
  return {
    get: () => value,
    set: (next: T) => {
      value = next;
      listeners.forEach((l) => l());
    },
    subscribe: (l: Listener) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
  };
}

const bag = createStore(false);
export const setBagOpen = bag.set;
export const useBagOpen = () => useSyncExternalStore(bag.subscribe, bag.get, () => false);

const toast = createStore<{ id: number; message: string } | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let toastId = 0;

export function notify(message: string) {
  toast.set({ id: ++toastId, message });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.set(null), 2800);
}
export const useToast = () => useSyncExternalStore(toast.subscribe, toast.get, () => null);
