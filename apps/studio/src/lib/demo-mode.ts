/**
 * Demo mode: shows clearly marked fictional records and disables every live provider.
 * Defaults to ON until a production database and providers are configured, so the
 * application can never present sample figures as real business data without an
 * explicit, deliberate switch (DEMO_MODE=false).
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE !== "false";
}
