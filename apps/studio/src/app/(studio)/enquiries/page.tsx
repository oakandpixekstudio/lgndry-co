import type { Metadata } from "next";
import { WorkspaceRoute } from "@/features/workspaces/components/workspace-route";
import { enquiriesWorkspace } from "@/features/workspaces/demo-data";

export const metadata: Metadata = { title: "Enquiries" };
export default function EnquiriesPage() { return <WorkspaceRoute config={enquiriesWorkspace} phase="Phase 6 (communications and intelligence)" />; }
