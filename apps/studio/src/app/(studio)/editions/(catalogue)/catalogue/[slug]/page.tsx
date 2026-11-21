import type { Metadata } from "next";
import { ArtworkEditor } from "@/features/catalogue/components/artwork-editor";

export const metadata: Metadata = { title: "Edit artwork" };
export default async function ArtworkEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ArtworkEditor slug={decodeURIComponent(slug)} />;
}
