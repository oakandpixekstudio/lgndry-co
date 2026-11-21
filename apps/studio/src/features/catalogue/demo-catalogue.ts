import type { CatalogueArtwork, CatalogueCollection, CatalogueImage, CatalogueState, CatalogueVariant, MediaSlot } from "./types";

/**
 * DEMO catalogue. Titles and slugs follow the storefront prototype so both apps read the same way,
 * but every price, edition size and image here is a placeholder. None of it is approved (docs/12 section 7).
 */

export const COLLECTIONS: CatalogueCollection[] = [
  { slug: "open-editions", title: "Open Editions" },
  { slug: "individual-works", title: "Individual Works" },
  { slug: "photographic-series", title: "Photographic Series" },
  { slug: "collectors-editions", title: "Collector's Editions" },
];

export const CATEGORIES = ["Landscape", "Documentary", "Movement", "Portraiture"];
export const SIZE_SUGGESTIONS = ["A3", "A2", "A1", "Set"];
export const FRAME_SUGGESTIONS = ["Unframed", "Black frame", "Natural frame"];

const PLACEHOLDERS = ["/artwork-placeholders/dune.svg", "/artwork-placeholders/waves.svg", "/artwork-placeholders/cliff.svg"];

const cover = (id: string, title: string, n: number): CatalogueImage => ({
  id: `${id}-cover`,
  assetId: null,
  name: `${title} (cover)`,
  url: PLACEHOLDERS[n % PLACEHOLDERS.length]!,
  role: "cover",
  altText: `${title}, sample monochrome artwork`,
  focalX: 50,
  focalY: 50,
});

const variant = (sku: string, sizeLabel: string, frameOption: string, rand: number | null, active = true): CatalogueVariant => ({
  id: `${sku}-${sizeLabel}-${frameOption}`.toLowerCase().replace(/\s+/g, "-"),
  sku: `${sku}-${sizeLabel}${frameOption === "Unframed" ? "" : `-${frameOption.split(" ")[0]!.toUpperCase()}`}`,
  sizeLabel,
  frameOption,
  priceCents: rand === null ? null : rand * 100,
  active,
});

function artwork(partial: Partial<CatalogueArtwork> & Pick<CatalogueArtwork, "id" | "sku" | "slug" | "title">, n: number): CatalogueArtwork {
  return {
    collectionSlug: null,
    category: "Landscape",
    summary: "",
    story: "",
    saleMode: "buy",
    editionKind: "open",
    availabilityNote: "",
    featured: false,
    showRemaining: false,
    releaseStatus: "draft",
    publishedAt: null,
    images: [cover(partial.id, partial.title, n)],
    variants: [],
    editionRun: null,
    ...partial,
  };
}

export const DEMO_ARTWORKS: CatalogueArtwork[] = [
  artwork({
    id: "art-modishi", sku: "LGN-0001", slug: "modishi-wa-lebowa", title: "Modishi wa Lebowa", collectionSlug: "collectors-editions", category: "Landscape",
    summary: "A figure holds the horizon under a hazy Limpopo sky.",
    story: "Light settles slowly over the northern plains. A single figure stands inside it, neither dwarfed by the land nor separate from it.",
    editionKind: "limited", featured: true, releaseStatus: "published", publishedAt: "2026-10-02T08:00:00Z",
    editionRun: { runCode: "R1", maxCopies: 25, lowStockThreshold: 5 },
    variants: [variant("LGN-0001", "A3", "Unframed", 8400), variant("LGN-0001", "A2", "Unframed", 9750), variant("LGN-0001", "A2", "Black frame", 11200)],
  }, 0),
  artwork({
    id: "art-gather", sku: "LGN-0002", slug: "where-we-gather", title: "Where We Gather", collectionSlug: "individual-works", category: "Documentary",
    summary: "A gathering beneath a clear sky.", story: "People arrive in ones and twos, and the afternoon becomes an occasion.",
    editionKind: "limited", releaseStatus: "published", publishedAt: "2026-10-09T08:00:00Z",
    editionRun: { runCode: "R1", maxCopies: 25, lowStockThreshold: 5 },
    variants: [variant("LGN-0002", "A3", "Unframed", 9800), variant("LGN-0002", "A2", "Unframed", 11150)],
  }, 1),
  artwork({
    id: "art-longway", sku: "LGN-0003", slug: "the-long-way-home", title: "The Long Way Home", collectionSlug: "individual-works", category: "Landscape",
    summary: "A road that takes its time.", story: "", editionKind: "limited",
    editionRun: { runCode: "R1", maxCopies: 15, lowStockThreshold: 3 },
    variants: [variant("LGN-0003", "A3", "Unframed", 12500)],
  }, 2),
  artwork({
    id: "art-place", sku: "LGN-0004", slug: "the-place-we-know", title: "The Place We Know", collectionSlug: "open-editions", category: "Landscape",
    summary: "Familiar ground, seen slowly.", story: "Printed to order and never capped.",
    releaseStatus: "published", publishedAt: "2026-09-18T08:00:00Z",
    variants: [variant("LGN-0004", "A3", "Unframed", 3900), variant("LGN-0004", "A2", "Unframed", 5250), variant("LGN-0004", "A1", "Unframed", 7000)],
  }, 0),
  artwork({
    id: "art-distance", sku: "LGN-0005", slug: "before-the-distance", title: "Before the Distance", collectionSlug: "open-editions", category: "Landscape",
    summary: "The quiet before the road opens.", story: "",
    variants: [variant("LGN-0005", "A3", "Unframed", 4600), variant("LGN-0005", "A2", "Unframed", null, false)],
    images: [{ ...cover("art-distance", "Before the Distance", 1), altText: "" }],
  }, 1),
  artwork({
    id: "art-light", sku: "LGN-0006", slug: "held-in-the-light", title: "Held in the Light", collectionSlug: "open-editions", category: "Portraiture",
    summary: "A portrait lit from one side.", story: "Soft window light, a steady gaze.",
    releaseStatus: "scheduled", publishedAt: "2026-12-01T08:00:00Z",
    variants: [variant("LGN-0006", "A3", "Unframed", 5500)],
  }, 2),
  artwork({
    id: "art-mundane", sku: "LGN-0007", slug: "found-beauty-in-the-mundane", title: "Found Beauty in the Mundane", collectionSlug: "photographic-series", category: "Documentary",
    summary: "A complete set, hung as one conversation.", story: "", saleMode: "enquire", editionKind: "limited",
    availabilityNote: "Availability confirmed privately, with the edition register.",
    editionRun: { runCode: "SET", maxCopies: 5, lowStockThreshold: 1 },
    variants: [variant("LGN-0007", "Set", "Unframed", null)],
    images: [],
  }, 0),
];

export const DEMO_SLOTS: MediaSlot[] = [
  { key: "home.hero", assetId: null, label: "Home hero", page: "Home", ratio: "16:9", imageUrl: "/artwork-placeholders/dune.svg", altText: "A figure standing in a golden field beneath a hazy sky", focalX: 40, focalY: 50 },
  { key: "home.intro_1", assetId: null, label: "Home intro, first image", page: "Home", ratio: "4:5", imageUrl: "/artwork-placeholders/waves.svg", altText: "Documentary image of a gathering beneath a clear sky", focalX: 50, focalY: 50 },
  { key: "home.intro_2", assetId: null, label: "Home intro, second image", page: "Home", ratio: "4:5", imageUrl: "/artwork-placeholders/cliff.svg", altText: "Architectural form in raking light", focalX: 50, focalY: 50 },
  { key: "studio.hero", assetId: null, label: "Studio page hero", page: "Studio", ratio: "3:2", imageUrl: "/artwork-placeholders/waves.svg", altText: "Movement and form documented in fine-art photography", focalX: 50, focalY: 40 },
  { key: "commission.hero", assetId: null, label: "Commission page hero", page: "Commission", ratio: "3:2", imageUrl: "/artwork-placeholders/dune.svg", altText: "Commissioned visual storytelling work", focalX: 50, focalY: 50 },
  { key: "menu.collection", assetId: null, label: "Menu feature image", page: "Site menu", ratio: "1:1", imageUrl: null, altText: "", focalX: 50, focalY: 50 },
];

/** The fixed places on the website that hold an image (labels and shapes come from the design, not the database). */
export const SLOT_DEFINITIONS = DEMO_SLOTS.map(({ key, label, page, ratio }) => ({ key, label, page, ratio }));

export const seedCatalogue = (): CatalogueState => ({
  artworks: structuredClone(DEMO_ARTWORKS),
  slots: structuredClone(DEMO_SLOTS),
});
