import { createHmac } from "node:crypto";

/**
 * Hands a visitor's form to the Studio Desk database.
 *
 * Runs ONLY on the server. It uses the service key, which must never reach the browser (so it is read from
 * SUPABASE_SERVICE_ROLE_KEY, not NEXT_PUBLIC_*). The database functions it calls check every field again, refuse
 * floods, and can be run by nothing but this key.
 */

export type IntakeResult =
  | { ok: true; ref?: string }
  | { ok: false; code: "not_configured" | "invalid" | "rate_limited" | "error"; field?: string };

function connection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

/** A one-way fingerprint of the visitor's address, used only to refuse floods. The address itself is never stored. */
export function visitorHash(forwardedFor: string | null): string | undefined {
  const conn = connection();
  const ip = forwardedFor?.split(",")[0]?.trim();
  if (!conn || !ip) return undefined;
  return createHmac("sha256", conn.key).update(ip).digest("hex").slice(0, 32);
}

export async function callIntake(fn: "intake_enquiry" | "intake_newsletter", payload: Record<string, unknown>): Promise<IntakeResult> {
  const conn = connection();
  if (!conn) return { ok: false, code: "not_configured" };

  let response: Response;
  try {
    response = await fetch(`${conn.url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: conn.key, Authorization: `Bearer ${conn.key}` },
      body: JSON.stringify({ p: payload }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { ok: false, code: "error" };
  }

  if (response.ok) {
    const body = (await response.json().catch(() => null)) as string | null;
    return { ok: true, ref: typeof body === "string" ? body : undefined };
  }
  const detail = (await response.json().catch(() => null)) as { message?: string } | null;
  const message = detail?.message ?? "";
  if (message.startsWith("invalid_input")) return { ok: false, code: "invalid", field: message.split(":")[1] };
  if (message.startsWith("rate_limited")) return { ok: false, code: "rate_limited" };
  if (message.startsWith("not_configured")) return { ok: false, code: "not_configured" };
  return { ok: false, code: "error" };
}
