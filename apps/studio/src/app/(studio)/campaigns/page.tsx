import type { Metadata } from "next";
import { WorkspaceRoute } from "@/features/workspaces/components/workspace-route";
import { campaignsWorkspace } from "@/features/workspaces/demo-data";

export const metadata: Metadata = { title: "Campaigns" };
export default function CampaignsPage() { return <WorkspaceRoute config={campaignsWorkspace} phase="Phase 6 (communications and intelligence)" />; }
