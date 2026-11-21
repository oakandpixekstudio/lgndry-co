import type { Metadata } from "next";
import { WorkspaceRoute } from "@/features/workspaces/components/workspace-route";
import { ordersWorkspace } from "@/features/workspaces/demo-data";

export const metadata: Metadata = { title: "Orders" };
export default function OrdersPage() { return <WorkspaceRoute config={ordersWorkspace} phase="Phase 3 (customers, editions, orders)" />; }
