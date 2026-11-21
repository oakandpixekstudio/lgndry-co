import "server-only";

import { isAuthConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type StaffRole = "owner" | "studio_manager" | "finance" | "photographer" | "analyst";

export const ROLE_LABEL: Record<StaffRole, string> = {
  owner: "Owner",
  studio_manager: "Studio Manager",
  finance: "Finance",
  photographer: "Photographer",
  analyst: "Analyst",
};
// Higher number wins when someone holds more than one role.
const ROLE_RANK: Record<StaffRole, number> = { owner: 5, studio_manager: 4, finance: 3, photographer: 2, analyst: 1 };

export interface StaffMember {
  email: string;
  name: string;
  initials: string;
  role: StaffRole;
  roleLabel: string;
  workspaceId: string;
}

export type StaffContext =
  | { status: "open" } // sign-in is not configured: demo mode, as before
  | { status: "signed-out" }
  | { status: "no-access"; email: string }
  | { status: "ok"; staff: StaffMember };

const initialsOf = (name: string) =>
  name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]!.toUpperCase()).join("") || "??";

/**
 * Who is using the studio? Checked on the server for every page, in addition to proxy.ts.
 * Being signed in is not enough: the person must also hold an ACTIVE staff role in the workspace.
 */
export async function getStaffContext(): Promise<StaffContext> {
  if (!isAuthConfigured()) return { status: "open" };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "open" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed-out" };

  // Row-level security lets a signed-in user read only their own membership rows.
  const { data: memberships } = await supabase.from("workspace_memberships").select("workspace_id, role").eq("active", true);
  const best = (memberships ?? [])
    .filter((row): row is { workspace_id: string; role: StaffRole } => row.role in ROLE_RANK)
    .sort((a, b) => ROLE_RANK[b.role] - ROLE_RANK[a.role])[0];
  const email = user.email ?? "unknown";
  if (!best) return { status: "no-access", email };

  const metaName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
  const name = metaName || email.split("@")[0]!.replace(/[._-]+/g, " ");
  return {
    status: "ok",
    staff: { email, name, initials: initialsOf(name), role: best.role, roleLabel: ROLE_LABEL[best.role], workspaceId: best.workspace_id },
  };
}
