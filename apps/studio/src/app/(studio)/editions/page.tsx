import type { Metadata } from "next";
import { WorkspaceRoute } from "@/features/workspaces/components/workspace-route";
import { editionsWorkspace } from "@/features/workspaces/demo-data";

export const metadata: Metadata = { title: "Editions" };
export default function EditionsPage() { return <WorkspaceRoute config={editionsWorkspace} phase="Phase 3 (customers, editions, orders)" />; }
