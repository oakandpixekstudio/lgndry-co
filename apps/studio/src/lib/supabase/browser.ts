"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

/** Browser client. Sessions live in HttpOnly-capable cookies managed by @supabase/ssr, never in localStorage. */
export function createSupabaseBrowserClient() {
  const config = getSupabaseConfig();
  return config ? createBrowserClient(config.url, config.key) : null;
}
