import type { Metadata } from "next";
import { CatalogueIndex } from "@/features/catalogue/components/catalogue-index";

export const metadata: Metadata = { title: "Catalogue" };
export default function CataloguePage() {
  return <CatalogueIndex />;
}
