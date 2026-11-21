import type { Metadata } from "next";
import { WorkspacePage } from "@/features/workspaces/components/workspace-page";
import { insightsWorkspace } from "@/features/workspaces/admin-workspaces";

export const metadata: Metadata = { title: "Insights" };

export default function InsightsPage() {
  return <WorkspacePage config={insightsWorkspace} />;
}
