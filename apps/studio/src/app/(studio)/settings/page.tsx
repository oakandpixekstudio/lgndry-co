import type { Metadata } from "next";
import { getStaffContext } from "@/features/auth/staff";
import { SettingsDashboard } from "@/features/settings/components/settings-dashboard";
import { SettingsLive } from "@/features/settings/components/settings-live";
import { loadSettings } from "@/features/settings/live";

export const metadata: Metadata = { title: "Settings" };

/**
 * Signed in with a staff role: real, read-only facts about the studio, its connections, team and access rules.
 * Sign-in not configured: the original sample screen, clearly marked as demo data.
 */
export default async function SettingsPage() {
  const context = await getStaffContext();
  if (context.status !== "ok") return <SettingsDashboard />;
  const data = await loadSettings(context.staff.workspaceId, context.staff.role);
  return <SettingsLive staff={context.staff} data={data} />;
}
