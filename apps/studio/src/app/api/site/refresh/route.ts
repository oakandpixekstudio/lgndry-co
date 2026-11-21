import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * After a catalogue change, tells the public website to refresh so visitors see it within moments.
 * Only an owner or studio manager can trigger it. The shared secret never leaves the server.
 * Nothing here can fail a save: if the site cannot be reached it still updates itself within five minutes.
 */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ refreshed: false, reason: "not connected" }, { status: 503 });

  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) return NextResponse.json({ refreshed: false, reason: "sign in" }, { status: 401 });

  const { data: memberships } = await supabase.from("workspace_memberships").select("role").eq("active", true);
  const allowed = (memberships ?? []).some((row: { role: string }) => row.role === "owner" || row.role === "studio_manager");
  if (!allowed) return NextResponse.json({ refreshed: false, reason: "not allowed" }, { status: 403 });

  const url = process.env.STOREFRONT_REVALIDATE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!url || !secret) return NextResponse.json({ refreshed: false, reason: "not configured" }, { status: 202 });

  try {
    const response = await fetch(url, { method: "POST", headers: { "x-revalidate-secret": secret }, signal: AbortSignal.timeout(8000), cache: "no-store" });
    return NextResponse.json({ refreshed: response.ok });
  } catch {
    return NextResponse.json({ refreshed: false, reason: "site unreachable" }, { status: 202 });
  }
}
