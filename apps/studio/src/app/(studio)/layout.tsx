import { StudioShell } from "@/components/layout/studio-shell";
import { getIntelligenceSnapshot } from "@/features/intelligence/queries/get-snapshot";
import { formatTopbarDate } from "@/lib/format";
import { isDemoMode } from "@/lib/demo-mode";

// Operational data: always rendered per request, never statically cached.
export const dynamic = "force-dynamic";

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://www.lgndry-co.co.za/";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const result = await getIntelligenceSnapshot();
  const counts = result.status === "ok" ? result.snapshot.navCounts : {};

  return (
    <StudioShell counts={counts} demo={isDemoMode()} dateLabel={formatTopbarDate(new Date())} storefrontUrl={STOREFRONT_URL}>
      {children}
    </StudioShell>
  );
}
