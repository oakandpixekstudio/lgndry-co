import type { Metadata } from "next";
import { CatalogueGate } from "@/features/catalogue/components/catalogue-gate";
import { CatalogueIndex } from "@/features/catalogue/components/catalogue-index";

export const metadata: Metadata = { title: "Catalogue" };
export default function CataloguePage() {
  return <CatalogueGate title="Catalogue"><CatalogueIndex /></CatalogueGate>;
}
