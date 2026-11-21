import type { ReactNode } from "react";
import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";
import { isDemoMode } from "@/lib/demo-mode";

/** Catalogue screens run on demo data only until the database and sign-in are connected. */
export function CatalogueGate({ title, children }: { title: string; children: ReactNode }) {
  if (isDemoMode()) return <>{children}</>;
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
