import "server-only";

import { ROLE_LABEL, type StaffRole } from "@/features/auth/staff";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface Connection {
  id: string;
  name: string;
  state: "on" | "off" | "waiting";
  /** Plain words about what it means for the studio. Never contains a key or secret. */
  detail: string;
}

export interface TeamMember { email: string; role: string; active: boolean; joined: string }

export interface SettingsData {
  workspace: { name: string; timezone: string; currency: string; legalNameSet: boolean; taxSet: boolean } | null;
  connections: Connection[];
  /** Null when the person may not see the team, or the server key needed to list it is missing. */
  team: { members: TeamMember[] } | { unavailable: string } | null;
}

/**
 * Which outside services are connected, judged only by whether their settings exist on the server. The values are
 * never read into the page, so no secret can leak through this screen.
 */
export function connectionStatus(): Connection[] {
  const has = (name: string) => Boolean(process.env[name] && !process.env[name]!.startsWith("your-"));
  return [
    { id: "database", name: "Database and sign-in", state: has("NEXT_PUBLIC_SUPABASE_URL") ? "on" : "off", detail: has("NEXT_PUBLIC_SUPABASE_URL") ? "Connected. Staff sign in and all screens read your real records." : "Not connected. The studio is showing demo data." },
    { id: "images", name: "Image processing and file tidy-up", state: has("SUPABASE_SERVICE_ROLE_KEY") ? "on" : "off", detail: has("SUPABASE_SERVICE_ROLE_KEY") ? "The server key is set, so uploads are turned into web-sized copies." : "The server key is missing, so image uploads and the unused-files tidy-up will not work." },
    { id: "refresh", name: "Instant website refresh", state: has("STOREFRONT_REVALIDATE_URL") && has("REVALIDATE_SECRET") ? "on" : "off", detail: has("STOREFRONT_REVALIDATE_URL") && has("REVALIDATE_SECRET") ? "Catalogue changes ask the website to refresh straight away." : "Not set up. The website still catches up on its own, within a few minutes." },
    { id: "email", name: "Email sending", state: "waiting", detail: "Not connected. Waiting for the client's email service (Resend) and a verified sender address. Until then the studio replies from its own mail program." },
    { id: "payments", name: "Payments", state: "waiting", detail: "No payment provider chosen yet, so the website takes enquiries only. Nothing can be marked paid." },
    { id: "twostep", name: "Two-step sign-in", state: "waiting", detail: "Not switched on. It needs the client present to set up, and is required before payments go live." },
  ];
}

export async function loadSettings(workspaceId: string, role: StaffRole): Promise<SettingsData> {
  const connections = connectionStatus();
  const canSeeStudio = role === "owner" || role === "studio_manager";
  if (!canSeeStudio) return { workspace: null, connections: [], team: null };

  const supabase = await createSupabaseServerClient();
  let workspace: SettingsData["workspace"] = null;
  if (supabase) {
    const { data } = await supabase.from("workspaces").select("name, timezone, currency, legal_name, tax_config_json").eq("id", workspaceId).maybeSingle();
    if (data) workspace = { name: data.name, timezone: data.timezone, currency: data.currency, legalNameSet: Boolean(data.legal_name), taxSet: data.tax_config_json !== null };
  }

  let team: SettingsData["team"] = null;
  if (role === "owner") {
    const admin = createSupabaseAdminClient();
    if (!admin) {
      team = { unavailable: "Listing the team needs the server key (SUPABASE_SERVICE_ROLE_KEY) on this project." };
    } else {
      const [memberships, users] = await Promise.all([
        admin.from("workspace_memberships").select("user_id, role, active, joined_at").eq("workspace_id", workspaceId).order("joined_at"),
        admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
      ]);
      if (memberships.error || users.error) {
        team = { unavailable: "The team could not be loaded right now." };
      } else {
        const emails = new Map(users.data.users.map((user) => [user.id, user.email ?? "No email"]));
        team = {
          members: (memberships.data ?? []).map((row) => ({
            email: emails.get(row.user_id as string) ?? "Unknown user", role: ROLE_LABEL[row.role as StaffRole] ?? String(row.role), active: Boolean(row.active), joined: row.joined_at as string,
          })),
        };
      }
    }
  }
  return { workspace, connections, team };
}
