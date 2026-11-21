"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { makeCatalogue, type Catalogue, type CatalogueSnapshot } from "@/lib/catalogue-model";

const CatalogueContext = createContext<Catalogue | null>(null);

/** Hands the server-loaded catalogue to every client component (bag, checkout, search, filters). */
export function CatalogueProvider({ snapshot, children }: { snapshot: CatalogueSnapshot; children: ReactNode }) {
  const catalogue = useMemo(() => makeCatalogue(snapshot), [snapshot]);
  return <CatalogueContext.Provider value={catalogue}>{children}</CatalogueContext.Provider>;
}

export function useCatalogue(): Catalogue {
  const catalogue = useContext(CatalogueContext);
  if (!catalogue) throw new Error("useCatalogue must be used inside <CatalogueProvider> (the root layout).");
  return catalogue;
}
