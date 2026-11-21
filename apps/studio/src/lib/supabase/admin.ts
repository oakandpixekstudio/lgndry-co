import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";

/**
 * Service-role client: it BYPASSES row-level security. It exists for one job: writing web-sized copies into the
 * public image bucket, which no signed-in browser may write to. Callers must check who is asking BEFORE using it.
 *
 * The key is read from SUPABASE_SERVICE_ROLE_KEY (never NEXT_PUBLIC_*), so it can never reach the browser bundle.
 * Returns null when the key is not configured.
 */
export function createSupabaseAdminClient() {
  const config = getSupabaseConfig();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!config || !key || key.startsWith("your-")) return null;
  return createClient(config.url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
