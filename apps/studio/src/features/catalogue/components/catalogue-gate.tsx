import type { ReactNode } from "react";
import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";
import { getStaffContext } from "@/features/auth/staff";
import { isDemoMode } from "@/lib/demo-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchCatalogue, type CatalogueData } from "../db";
import { DemoCatalogueProvider } from "./demo-provider";
import { LiveCatalogueProvider } from "./live-provider";

/**
 * Decides where the catalogue comes from:
 *   signed in with a staff role  -> the real database (as that person, so row-level security applies)
 *   sign-in not configured, demo -> sample data in this browser tab
 *   anything else                -> nothing is shown
 */
export async function CatalogueGate({ title, children }: { title: string; children: ReactNode }) {
  const context = await getStaffContext();

  if (context.status === "ok") {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      // Load first, build the page after: errors from loading are caught here, rendering errors are not.
      let initial: CatalogueData | null = null;
      let loadError = "";
      try {
        initial = await fetchCatalogue(supabase, context.staff.workspaceId);
      } catch (problem) {
        loadError = problem instanceof Error ? problem.message : "";
      }
      if (!initial) {
        return (
          <div className="cat-page">
            <div className="cat-empty-box" role="alert">
              The catalogue could not be loaded. {loadError} Check that migrations 0001 to 0007 have been applied, then reload.
            </div>
          </div>
        );
      }
      const canEdit = context.staff.role === "owner" || context.staff.role === "studio_manager";
      return (
        <LiveCatalogueProvider initial={initial} workspaceId={context.staff.workspaceId} canEdit={canEdit}>
          {children}
        </LiveCatalogueProvider>
      );
    }
  }

  if (context.status === "open" && isDemoMode()) return <DemoCatalogueProvider>{children}</DemoCatalogueProvider>;

  return (
    <PhasePlaceholder
      eyebrow="Editions"
      title={<>{title}</>}
      sub="Live catalogue data is hidden until the database, authentication and permission policies are connected."
      phase="Phase 3 (catalogue and images)"
      delivers={["Authorised server data", "Persistent, audited publishing", "Private masters and public web copies"]}
    />
  );
}
