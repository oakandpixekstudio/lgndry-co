"use client";

import { useToast } from "@/lib/ui-store";
import { cn } from "@/lib/utils";

export function Toaster() {
  const toast = useToast();
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed bottom-7 left-1/2 z-[120] max-w-[min(480px,90%)] -translate-x-1/2 bg-ink px-[18px] py-3.5 text-center text-[11px] tracking-[0.04em] text-white uppercase transition-all duration-300",
        toast ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
      )}
    >
      {toast?.message}
    </div>
  );
}
