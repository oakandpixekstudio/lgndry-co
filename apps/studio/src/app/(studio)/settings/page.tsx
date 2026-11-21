import type { Metadata } from "next";
import { WorkspacePage } from "@/features/workspaces/components/workspace-page";
import { settingsWorkspace } from "@/features/workspaces/admin-workspaces";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <WorkspacePage config={settingsWorkspace} />;
}
