import type { Metadata } from "next";
import { ArtworkEditor } from "@/features/catalogue/components/artwork-editor";
import { CatalogueGate } from "@/features/catalogue/components/catalogue-gate";

export const metadata: Metadata = { title: "Edit artwork" };
export default async function ArtworkEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CatalogueGate title="Edit artwork"><ArtworkEditor slug={decodeURIComponent(slug)} /></CatalogueGate>;
}
