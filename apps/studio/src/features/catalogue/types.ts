/**
 * Catalogue model. Field names mirror packages/database/migrations/0002 so the demo store can be swapped
 * for Supabase queries without reshaping the screens. Money is integer ZAR cents.
 */

export type ReleaseStatus = "draft" | "scheduled" | "published" | "retired";
export type SaleMode = "buy" | "enquire";
export type EditionKind = "open" | "limited";
export type ImageRole = "cover" | "gallery" | "detail" | "room_view";

export interface CatalogueImage {
  id: string;
  /** Live: the private master this picture comes from (web copies hang off it). Demo: null. */
  assetId: string | null;
  name: string;
  /** Demo: a placeholder path or an in-session data URL. Real: a public web derivative of a private master. */
  url: string;
  role: ImageRole;
  altText: string;
  /** Focal point, 0-100 (percent). Keeps the crop on the subject at every aspect ratio. */
  focalX: number;
  focalY: number;
}

export interface CatalogueVariant {
  id: string;
  sku: string;
  sizeLabel: string;
  frameOption: string;
  /** null = price on request */
  priceCents: number | null;
  active: boolean;
}

export interface CatalogueEditionRun {
  runCode: string;
  maxCopies: number;
  lowStockThreshold: number;
}

export interface CatalogueArtwork {
  id: string;
  sku: string;
  slug: string;
  title: string;
  collectionSlug: string | null;
  category: string;
  summary: string;
  story: string;
  saleMode: SaleMode;
  editionKind: EditionKind;
  availabilityNote: string;
  featured: boolean;
  /** May the website show "N copies remaining"? Off until the owner approves (docs/12 section 7). */
  showRemaining: boolean;
  releaseStatus: ReleaseStatus;
  publishedAt: string | null;
  images: CatalogueImage[];
  variants: CatalogueVariant[];
  editionRun: CatalogueEditionRun | null;
}

export interface CatalogueCollection {
  slug: string;
  title: string;
}

/** A named place on the website that shows an image, e.g. the home page hero. */
export interface MediaSlot {
  key: string;
  assetId: string | null;
  label: string;
  page: string;
  ratio: string;
  imageUrl: string | null;
  altText: string;
  focalX: number;
  focalY: number;
}

export interface CatalogueState {
  artworks: CatalogueArtwork[];
  slots: MediaSlot[];
}
