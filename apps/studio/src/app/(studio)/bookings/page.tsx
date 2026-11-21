import type { Metadata } from "next";
import { WorkspaceRoute } from "@/features/workspaces/components/workspace-route";
import { bookingsWorkspace } from "@/features/workspaces/demo-data";

export const metadata: Metadata = { title: "Bookings" };
export default function BookingsPage() { return <WorkspaceRoute config={bookingsWorkspace} phase="Phase 5 (photography bookings)" />; }
