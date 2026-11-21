import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";
import { isDemoMode } from "@/lib/demo-mode";
import type { WorkspaceConfig } from "../types";
import { WorkspacePage } from "./workspace-page";

export function WorkspaceRoute({ config, phase }: { config: WorkspaceConfig; phase: string }) {
  if (isDemoMode()) return <WorkspacePage config={config} />;

  return (
    <PhasePlaceholder
      eyebrow={config.eyebrow}
      title={<>{config.title} <em>{config.editorial}</em></>}
      sub="Live records are intentionally hidden until the database, authentication and permission policies are connected."
      phase={phase}
      delivers={["Authorised server data", "Persistent, audited actions", "Empty, loading and error states"]}
    />
  );
}

