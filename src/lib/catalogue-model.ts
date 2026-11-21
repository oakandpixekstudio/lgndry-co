import { money, type Collection, type Work } from "@/lib/catalogue";

/**
 * The catalogue as the site sees it: works, collections and the named page images.
 * Plain data (safe to send from the server to the browser) plus lookup helpers built from it.
 */

export interface SlotImage {
  /** A full address (database) or a static file name. */
  src: string;
  alt: string;
  focal?: string;
}

export interface CatalogueSnapshot {
  works: Work[];
  collections: Collection[];
  /** Pictures for named places on the site, e.g. "home.hero". Empty places fall back to the built-in image. */
  slots: Record<string, SlotImage>;
  source: "database" | "static";
}

export interface Catalogue extends CatalogueSnapshot {
  getWork: (slug: string) => Work | undefined;
  getCollection: (slug: string) => Collection | undefined;
  worksByCollection: (slug: string) => Work[];
  featuredWorks: () => Work[];
  relatedWorks: (work: Work, n?: number) => Work[];
  /** The picture for a named place, or the built-in one while that place has none. */
  slotImage: (key: string, fallback: { file: string; alt: string; focal?: string }) => SlotImage;
}

export function makeCatalogue(snapshot: CatalogueSnapshot): Catalogue {
  const { works, collections, slots } = snapshot;
  return {
    ...snapshot,
    getWork: (slug) => works.find((w) => w.slug === slug),
    getCollection: (slug) => collections.find((c) => c.slug === slug),
    worksByCollection: (slug) => works.filter((w) => w.collection === slug),
    featuredWorks: () => works.filter((w) => w.featured),
    relatedWorks: (work, n = 3) =>
      works
        .filter((w) => w.slug !== work.slug && w.mode === "buy")
        .sort((a, b) => Number(b.collection === work.collection) - Number(a.collection === work.collection))
        .slice(0, n),
    slotImage: (key, fallback) => slots[key] ?? { src: fallback.file, alt: fallback.alt, focal: fallback.focal },
  };
}

/** "From R 3,900", or "By private enquiry" when nothing in the collection has a price. */
export function collectionFromLabel(works: Work[]): string {
  const prices = works.flatMap((w) => (w.variants?.length ? w.variants.map((v) => v.price) : [w.price])).filter((p): p is number => p !== null);
  return prices.length ? `From ${money(Math.min(...prices))}` : "By private enquiry";
}
