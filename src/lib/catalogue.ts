/**
 * LGNDRY.Co catalogue — PROTOTYPE DATA.
 *
 * Every price, edition size, dimension and spec below is a placeholder taken from the
 * development brief's "indicative" planning figures. None of it is approved. When the
 * Studio Desk (phase 2) exists this file is replaced by database queries; the shapes
 * below are intentionally close to what that schema will need.
 *
 * Open items (from the brief, section 14) are flagged with TODO(confirm).
 */

export type Tone = "earth" | "ritual" | "road" | "portrait" | "form" | "structure";

export type CollectionSlug =
  | "open-editions"
  | "individual-works"
  | "photographic-series"
  | "collectors-editions";

export type Category = "Landscape" | "Documentary" | "Movement" | "Portraiture";

export type SizeKey = "A3" | "A2" | "A1";
export type FinishKey = "Unframed" | "Black frame" | "Natural frame";

export const IMG_BASE = "/images/";

export const SIZES: Record<SizeKey, { label: string; dims: string; surcharge: number }> = {
  A3: { label: "A3", dims: "297 × 420 mm", surcharge: 0 },
  A2: { label: "A2", dims: "420 × 594 mm", surcharge: 1350 },
  A1: { label: "A1", dims: "594 × 841 mm", surcharge: 3100 },
};

export const FINISHES: Record<FinishKey, { label: string; note: string; surcharge: number }> = {
  Unframed: { label: "Unframed", note: "Rolled in protective tube", surcharge: 0 },
  "Black frame": { label: "Black frame", note: "Matt black, museum glazing", surcharge: 1450 },
  "Natural frame": { label: "Natural frame", note: "Raw oak, museum glazing", surcharge: 1750 },
};

export interface Collection {
  slug: CollectionSlug;
  title: string;
  kicker: string;
  intro: string;
  edition: string;
  from: string;
}

export const COLLECTIONS: Collection[] = [
  {
    slug: "open-editions",
    title: "Open Editions",
    kicker: "The accessible way in",
    intro:
      "Photographs printed to order and never capped. The simplest way to live with an LGNDRY image, in the size and finish that suits your wall.",
    edition: "Open edition · Made to order",
    from: "From R 2,500",
  },
  {
    slug: "individual-works",
    title: "Individual Works",
    kicker: "Considered, one at a time",
    intro:
      "Standalone photographs, each released in a small, deliberate run. Numbered, certified and finished by hand.",
    edition: "Limited run · Numbered",
    from: "From R 8,000",
  },
  {
    slug: "photographic-series",
    title: "Photographic Series",
    kicker: "A body of work, together",
    intro:
      "Connected sequences of images collected as a complete set. Built to be hung as one conversation across a wall.",
    edition: "Complete sets",
    from: "From R 30,000",
  },
  {
    slug: "collectors-editions",
    title: "Collector's Editions",
    kicker: "Five works. Strictly limited.",
    intro:
      "Our rarest releases. Each of the five is capped at a handful of copies, individually numbered and presented to museum standard with a signed certificate.",
    edition: "Strictly limited · Numbered",
    from: "By private enquiry",
  },
];

export type Edition =
  | { kind: "open" }
  | { kind: "limited"; size: number | null };

export interface Work {
  slug: string;
  title: string;
  collection: CollectionSlug;
  category: Category;
  /** Image file name on the existing LGNDRY site. Swap for /public assets later. */
  image: string;
  /** CSS object-position, lets one source image serve several crops. */
  focal?: string;
  tone: Tone;
  /** Base price in ZAR for the smallest size, unframed. null = on request. */
  price: number | null;
  mode: "buy" | "enquire";
  edition: Edition;
  summary: string;
  story: string;
  /** Short note shown on enquire-led works. */
  availabilityNote?: string;
  featured?: boolean;
}

export const WORKS: Work[] = [
  /* ---------- Collector's Editions ---------- */
  {
    slug: "modishi-wa-lebowa",
    title: "Modishi wa Lebowa",
    collection: "collectors-editions",
    category: "Landscape",
    image: "home-hero.webp",
    focal: "40% 50%",
    tone: "earth",
    price: null,
    mode: "enquire",
    // TODO(confirm): two prior allocations mentioned, one copy said to remain. Reconcile before showing a count.
    edition: { kind: "limited", size: 3 },
    summary: "A figure holds the horizon under a hazy Limpopo sky.",
    story:
      "Light settles slowly over the northern plains. A single figure stands inside it, neither dwarfed by the land nor separate from it. This is the work that defines the Collector's Editions: patient, quiet, and impossible to rush.",
    availabilityNote: "Availability confirmed privately, with the edition register.",
    featured: true,
  },
  {
    slug: "mashole",
    title: "Mashole",
    collection: "collectors-editions",
    category: "Documentary",
    image: "home-intro-4.webp",
    focal: "70% 45%",
    tone: "road",
    price: null,
    mode: "enquire",
    // TODO(confirm): existing sold / gifted / reserved copies.
    edition: { kind: "limited", size: 6 },
    summary: "Country, soft hills and the geometry of a long afternoon.",
    story:
      "Mashole is a study in distance and ordinary grace: a landscape you could drive past a hundred times, rendered the one time it stopped you.",
    availabilityNote: "Availability confirmed privately, with the edition register.",
  },
  {
    slug: "yellow-bone",
    title: "Yellow Bone",
    collection: "collectors-editions",
    category: "Portraiture",
    image: "about-hero.webp",
    focal: "50% 28%",
    tone: "portrait",
    price: null,
    mode: "enquire",
    // TODO(confirm): existing allocations and final register.
    edition: { kind: "limited", size: 5 },
    summary: "Presence, warmth and the space around a face.",
    story:
      "A portrait that asks for nothing and holds you anyway. Yellow Bone is built on restraint: negative space, natural light, and the confidence to leave things unsaid.",
    availabilityNote: "Availability confirmed privately, with the edition register.",
  },
  {
    slug: "vuma-bo-mma",
    title: "Vuma / Bo Mma",
    collection: "collectors-editions",
    category: "Documentary",
    image: "home-intro-1.webp",
    focal: "25% 55%",
    tone: "ritual",
    price: null,
    mode: "enquire",
    // TODO(confirm): edition size not finalised. Do not publish a number until it is.
    edition: { kind: "limited", size: null },
    summary: "A gathering, held in colour and in motion.",
    story:
      "Vuma / Bo Mma follows a collective moment: voices, cloth and light moving together. The edition size is being finalised, so this work is currently offered by enquiry only.",
    availabilityNote: "Edition size to be announced. Register your interest.",
  },
  {
    slug: "mama-tagal",
    title: "Mama Tagal",
    collection: "collectors-editions",
    category: "Landscape",
    image: "nav-collection.webp",
    focal: "60% 65%",
    tone: "structure",
    price: null,
    mode: "enquire",
    // TODO(confirm): title spelling and existing allocations.
    edition: { kind: "limited", size: 7 },
    summary: "The widest frame in the collection, and the quietest.",
    story:
      "Mama Tagal is the landscape of the five: wide, unhurried and generous. A place named for the woman who knows it best.",
    availabilityNote: "Availability confirmed privately, with the edition register.",
  },

  /* ---------- Individual Works ---------- */
  {
    slug: "a-quiet-form",
    title: "A Quiet Form",
    collection: "individual-works",
    category: "Movement",
    image: "about-hero.webp",
    focal: "55% 60%",
    tone: "form",
    price: 8400,
    mode: "buy",
    edition: { kind: "limited", size: 25 }, // TODO(confirm) run size
    summary: "Movement held as stillness.",
    story:
      "An intimate study of strength, grace and the space between. Shot in a single unhurried session and printed in a small run.",
    featured: true,
  },
  {
    slug: "where-we-gather",
    title: "Where We Gather",
    collection: "individual-works",
    category: "Documentary",
    image: "home-intro-1.webp",
    focal: "50% 50%",
    tone: "ritual",
    price: 9800,
    mode: "buy",
    edition: { kind: "limited", size: 25 }, // TODO(confirm) run size
    summary: "Collective presence, colour and movement.",
    story:
      "A study in people, together. The frame is crowded and somehow calm: proof that the most important scenes are rarely staged.",
    featured: true,
  },
  {
    slug: "the-long-way-home",
    title: "The Long Way Home",
    collection: "individual-works",
    category: "Landscape",
    image: "nav-collection.webp",
    focal: "50% 50%",
    tone: "road",
    price: 12500,
    mode: "buy",
    edition: { kind: "limited", size: 15 }, // TODO(confirm) run size
    summary: "A familiar road becomes a portrait of place.",
    story:
      "A stretch of road you might know by heart, and the distance still to travel. The longest way is often the one that teaches you the most.",
    featured: true,
  },

  /* ---------- Open Editions ---------- */
  {
    slug: "the-place-we-know",
    title: "The Place We Know",
    collection: "open-editions",
    category: "Landscape",
    image: "home-intro-2.webp",
    focal: "50% 50%",
    tone: "structure",
    price: 3900,
    mode: "buy",
    edition: { kind: "open" },
    summary: "A familiar building, and the memory it keeps.",
    story:
      "A testament to the places that shape our shared memory: ordinary architecture made monumental by afternoon light.",
  },
  {
    slug: "before-the-distance",
    title: "Before the Distance",
    collection: "open-editions",
    category: "Landscape",
    image: "home-intro-4.webp",
    focal: "30% 50%",
    tone: "road",
    price: 4600,
    mode: "buy",
    edition: { kind: "open" },
    summary: "Soft hills and the geometry of a road.",
    story:
      "Country, soft hills and a road that reveals itself slowly. The kind of view that makes a room feel larger.",
  },
  {
    slug: "held-in-the-light",
    title: "Held in the Light",
    collection: "open-editions",
    category: "Portraiture",
    image: "services-hero.webp",
    focal: "50% 40%",
    tone: "portrait",
    price: 5500,
    mode: "buy",
    edition: { kind: "open" },
    summary: "An unhurried portrait, carried by negative space.",
    story:
      "Simplicity, space and presence carry the story. An unhurried portrait made for living rooms, studios and quiet corners.",
  },

  /* ---------- Photographic Series ---------- */
  {
    slug: "found-beauty-in-the-mundane",
    title: "Found Beauty in the Mundane",
    collection: "photographic-series",
    category: "Documentary",
    image: "home-intro-2.webp",
    focal: "30% 60%",
    tone: "earth",
    // TODO(confirm): is R30k–R50k per set or per work? Can components be sold individually?
    price: 38000,
    mode: "enquire",
    edition: { kind: "limited", size: null },
    summary: "The studio's founding series, collected as a complete set.",
    story:
      "The series behind the studio's name: overlooked things, scenes not staged, moments not repeated. Offered as a complete set, with each print numbered to the others.",
    availabilityNote: "Complete sets only. Enquire to reserve.",
  },
];

export const worksByCollection = (slug: CollectionSlug) =>
  WORKS.filter((w) => w.collection === slug);

export const getWork = (slug: string) => WORKS.find((w) => w.slug === slug);

export const getCollection = (slug: string) => COLLECTIONS.find((c) => c.slug === slug);

export const featuredWorks = () => WORKS.filter((w) => w.featured);

export const relatedWorks = (work: Work, n = 3) =>
  WORKS.filter((w) => w.slug !== work.slug && w.mode === "buy")
    .sort((a, b) => Number(b.collection === work.collection) - Number(a.collection === work.collection))
    .slice(0, n);

export const money = (n: number) => "R " + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export function unitPrice(work: Work, size: SizeKey, finish: FinishKey): number | null {
  if (work.price === null) return null;
  // Photographic series are priced per set; size/finish do not apply.
  if (work.collection === "photographic-series") return work.price;
  return work.price + SIZES[size].surcharge + FINISHES[finish].surcharge;
}

export const editionLabel = (work: Work) => {
  if (work.edition.kind === "open") return "Open edition";
  if (work.edition.size === null) return "Limited edition · size to be announced";
  return `Limited edition of ${work.edition.size}`;
};

export const priceLabel = (work: Work) =>
  work.price === null ? "Price on request" : `${work.mode === "buy" && work.collection !== "photographic-series" ? "From " : ""}${money(work.price)}`;

export const imageUrl = (file: string) => IMG_BASE + file;
