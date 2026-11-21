/**
 * Supabase connection settings. Only the PUBLIC (publishable) key ever appears here; it is safe in the browser
 * because row-level security decides what it can do. The service-role key must never be read in this file.
 *
 * When neither variable is set the studio stays in demo mode with no sign-in, exactly as before.
 */
export interface SupabaseConfig {
  url: string;
  key: string;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  // Written out in full so Next can inline them into the browser bundle.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project") || key.startsWith("your-")) return null;
  return { url, key };
}

export const isAuthConfigured = () => getSupabaseConfig() !== null;

/** Only allow same-site relative paths after sign-in, never another website. */
export function safeNext(value: string | null | undefined, fallback = "/overview"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
