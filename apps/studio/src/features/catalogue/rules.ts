import type { CatalogueArtwork, ReleaseStatus } from "./types";

/** URL-safe segment: lowercase letters, digits and single hyphens. */
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const isValidSlug = (slug: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);

/** Whole rand typed by a person to integer cents. Empty or invalid means "on request". */
export const randToCents = (value: string): number | null => {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number(digits) * 100 : null;
};
export const centsToRand = (cents: number | null) => (cents === null ? "" : String(Math.round(cents / 100)));

export const fromPriceCents = (artwork: CatalogueArtwork): number | null => {
  const prices = artwork.variants.filter((variant) => variant.active && variant.priceCents !== null).map((variant) => variant.priceCents as number);
  return prices.length ? Math.min(...prices) : null;
};

export type IssueSection = "details" | "images" | "variants";
export interface PublishIssue {
  id: string;
  label: string;
  section: IssueSection;
  /** Blocking issues stop publication. Advice does not. */
  blocking: boolean;
}

/**
 * Mirrors the publish guard in migration 0002 (cover image, priced variant, edition run) plus the content
 * rules the website needs (alt text, slug, summary). The database remains the final authority.
 */
export function publishIssues(artwork: CatalogueArtwork, all: CatalogueArtwork[]): PublishIssue[] {
  const issues: PublishIssue[] = [];
  const add = (id: string, label: string, section: IssueSection, blocking = true) => issues.push({ id, label, section, blocking });

  if (!artwork.title.trim()) add("title", "Add a title", "details");
  if (!isValidSlug(artwork.slug)) add("slug", "Use a web address made of lowercase letters, digits and hyphens", "details");
  else if (all.some((other) => other.id !== artwork.id && other.slug === artwork.slug)) add("slug-unique", "Another work already uses this web address", "details");
  if (!artwork.summary.trim()) add("summary", "Add a one-line summary", "details");
  if (!artwork.collectionSlug) add("collection", "Choose a collection", "details");

  const covers = artwork.images.filter((image) => image.role === "cover");
  if (covers.length === 0) add("cover", "Add a cover image", "images");
  if (covers.length > 1) add("cover-many", "Only one image can be the cover", "images");
  if (artwork.images.some((image) => !image.altText.trim())) add("alt", "Every image needs alt text", "images");

  if (artwork.saleMode === "buy" && !artwork.variants.some((variant) => variant.active && variant.priceCents !== null)) {
    add("price", "Buy mode needs at least one active variant with a price", "variants");
  }
  if (artwork.editionKind === "limited" && (!artwork.editionRun || artwork.editionRun.maxCopies < 1)) {
    add("run", "A limited edition needs an edition run with a number of copies", "variants");
  }
  if (artwork.saleMode === "enquire" && !artwork.availabilityNote.trim()) add("note", "Add an availability note for visitors", "details", false);
  if (!artwork.story.trim()) add("story", "Add the story behind the work", "details", false);
  return issues;
}

export const statusLabel: Record<ReleaseStatus, string> = { draft: "Draft", scheduled: "Scheduled", published: "Published", retired: "Retired" };
export const statusTone: Record<ReleaseStatus, string> = { draft: "neutral", scheduled: "info", published: "success", retired: "warning" };

/** Things that make a save impossible (the database would refuse them). Drafts may be incomplete, but not broken. */
export function saveProblems(artwork: CatalogueArtwork): string[] {
  const problems: string[] = [];
  if (!artwork.title.trim()) problems.push("Add a title before saving.");
  if (!isValidSlug(artwork.slug)) problems.push("The web address can only use lowercase letters, digits and single hyphens.");
  if (artwork.variants.some((variant) => !variant.sizeLabel.trim())) problems.push("Every size needs a name, for example A3.");
  const seen = new Set<string>();
  for (const variant of artwork.variants) {
    const pair = `${variant.sizeLabel.trim().toLowerCase()}|${variant.frameOption.trim().toLowerCase()}`;
    if (seen.has(pair)) {
      problems.push(`Two sizes share the same size and finish (${variant.sizeLabel} ${variant.frameOption}).`);
      break;
    }
    seen.add(pair);
  }
  return problems;
}
