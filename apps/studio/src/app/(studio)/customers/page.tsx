import type { Metadata } from "next";
import { WorkspaceRoute } from "@/features/workspaces/components/workspace-route";
import { customersWorkspace } from "@/features/workspaces/demo-data";

export const metadata: Metadata = { title: "Customers" };
export default function CustomersPage() { return <WorkspaceRoute config={customersWorkspace} phase="Phase 3 (customers, editions, orders)" />; }
