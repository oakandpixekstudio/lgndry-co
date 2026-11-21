import type { Metadata } from "next";
import { WorkspaceRoute } from "@/features/workspaces/components/workspace-route";
import { invoicesWorkspace } from "@/features/workspaces/demo-data";

export const metadata: Metadata = { title: "Invoices" };
export default function InvoicesPage() { return <WorkspaceRoute config={invoicesWorkspace} phase="Phase 4 (invoice-first payment and documents)" />; }
