import "server-only";
import { isDemoMode } from "@/lib/demo-mode";
import type { SnapshotResult } from "../types";
import { buildDemoSnapshot } from "./demo-snapshot";

/**
 * Single entry point for Intelligence Center data.
 *
 * Demo mode returns clearly marked fictional data. Outside demo mode there is, as yet,
 * no database: this deliberately reports "unavailable" instead of inventing figures.
 * Phase 6 replaces the second branch with real, reconcilable read-model queries.
 */
export async function getIntelligenceSnapshot(): Promise<SnapshotResult> {
  if (isDemoMode()) {
    return { status: "ok", snapshot: buildDemoSnapshot() };
  }
  return {
    status: "unavailable",
    reason: "Live business data is not connected yet. The database arrives in Phase 2 and live metrics in Phase 6.",
  };
}
