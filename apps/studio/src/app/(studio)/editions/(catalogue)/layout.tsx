import { Suspense, type ReactNode } from "react";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { CatalogueGate } from "@/features/catalogue/components/catalogue-gate";
import { EditionsSubnav } from "@/features/catalogue/components/editions-subnav";

/**
 * One layout for the Catalogue, an artwork and Website images. It loads the catalogue ONCE and stays mounted while you
 * move between those pages, so opening a work and coming back is instant instead of reloading everything.
 * The tabs and a skeleton show at once; the data streams in behind them.
 */
export default function CatalogueLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="cat-page">
          <EditionsSubnav />
          <PageSkeleton />
        </div>
      }
    >
      <CatalogueGate title="Catalogue">{children}</CatalogueGate>
    </Suspense>
  );
}
