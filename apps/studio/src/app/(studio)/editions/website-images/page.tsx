import type { Metadata } from "next";
import { CatalogueGate } from "@/features/catalogue/components/catalogue-gate";
import { WebsiteImages } from "@/features/catalogue/components/website-images";

export const metadata: Metadata = { title: "Website images" };
export default function WebsiteImagesPage() {
  return <CatalogueGate title="Website images"><WebsiteImages /></CatalogueGate>;
}
