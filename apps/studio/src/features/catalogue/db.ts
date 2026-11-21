import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { SLOT_DEFINITIONS } from "./demo-catalogue";
import type {
  CatalogueArtwork, CatalogueCollection, CatalogueEditionRun, CatalogueImage, CatalogueVariant, EditionKind,
  ImageRole, MediaSlot, ReleaseStatus, SaleMode,
} from "./types";

/**
 * Reads and writes between the database rows (snake_case, uuids, cents) and the screens' shapes.
 * Works with ANY Supabase client: the server one (page loads) or the browser one (saves), always as the signed-in
 * user, so row-level security decides what comes back.
 */

interface ArtworkRow {
  id: string; sku: string; slug: string; title: string; collection_id: string | null; category: string | null;
  summary: string | null; story: string | null; sale_mode: SaleMode; edition_kind: EditionKind;
  availability_note: string | null; featured: boolean; show_remaining: boolean; release_status: ReleaseStatus;
  published_at: string | null;
}
interface ImageRow { id: string; artwork_id: string; asset_id: string; role: ImageRole; alt_text: string | null; focal_x: number | null; focal_y: number | null; sort_order: number }
interface VariantRow { id: string; artwork_id: string; edition_run_id: string | null; sku: string; size_label: string; frame_option: string; price_cents: number | null; active: boolean }
interface RunRow { id: string; artwork_id: string; run_code: string; max_copies: number; low_stock_threshold: number }
interface AssetRow { id: string; bucket: string; object_key: string; width_px: number | null; kind: "master" | "derivative"; master_asset_id: string | null }
interface SlotRow { slot_key: string; asset_id: string | null; alt_text: string | null; focal_x: number | null; focal_y: number | null }

export interface CatalogueData {
  artworks: CatalogueArtwork[];
  slots: MediaSlot[];
  collections: CatalogueCollection[];
}

export const publicUrl = (bucket: string, key: string) => `${getSupabaseConfig()?.url}/storage/v1/object/public/${bucket}/${key}`;

/** Picks the public web copy closest to 1600 px wide: sharp enough for the editor, light enough to load fast. */
function displayUrl(masterId: string, derivatives: AssetRow[]): string | null {
  const copies = derivatives.filter((asset) => asset.master_asset_id === masterId);
  const best = copies.sort((a, b) => Math.abs((a.width_px ?? 0) - 1600) - Math.abs((b.width_px ?? 0) - 1600))[0];
  return best ? publicUrl(best.bucket, best.object_key) : null;
}

const baseName = (key: string) => key.split("/").pop() ?? key;

/**
 * Loads the catalogue in two trips to the database instead of six: first everything that does not depend on anything
 * else (collections, works with their images, sizes and editions nested inside, website image slots), all at once;
 * then the files those pictures point at. Pass `onlyIds` to refresh just the works that were saved.
 */
export async function fetchCatalogue(db: SupabaseClient, workspaceId: string, onlyIds?: string[]): Promise<CatalogueData> {
  const fail = (what: string, message: string) => new Error(`Could not load ${what}: ${message}`);

  let artworkQuery = db
    .from("artworks")
    .select("*, artwork_images(*), artwork_variants(*), edition_runs(*)")
    .eq("workspace_id", workspaceId)
    .is("edition_runs.retired_at", null)
    .order("created_at", { ascending: false })
    .order("sort_order", { referencedTable: "artwork_images" })
    .order("created_at", { referencedTable: "artwork_variants" });
  if (onlyIds) artworkQuery = artworkQuery.in("id", onlyIds);

  const [collectionsRes, artworkRes, slotRes] = await Promise.all([
    db.from("collections").select("id, slug, title, sort_order").eq("workspace_id", workspaceId).order("sort_order"),
    artworkQuery,
    onlyIds
      ? Promise.resolve({ data: [] as SlotRow[], error: null })
      : db.from("media_slots").select("slot_key, asset_id, alt_text, focal_x, focal_y").eq("workspace_id", workspaceId),
  ]);
  if (collectionsRes.error) throw fail("collections", collectionsRes.error.message);
  if (artworkRes.error) throw fail("works", artworkRes.error.message);
  if (slotRes.error) throw fail("website images", slotRes.error.message);

  const collectionRows = (collectionsRes.data ?? []) as Array<{ id: string; slug: string; title: string }>;
  const collections = collectionRows.map(({ slug, title }) => ({ slug, title }));
  const slugById = new Map(collectionRows.map((row) => [row.id, row.slug]));

  type ArtworkWithChildren = ArtworkRow & { artwork_images: ImageRow[]; artwork_variants: VariantRow[]; edition_runs: RunRow[] };
  const artworkRows = (artworkRes.data ?? []) as unknown as ArtworkWithChildren[];
  const imageRows = artworkRows.flatMap((row) => row.artwork_images ?? []);
  const variantRows = artworkRows.flatMap((row) => row.artwork_variants ?? []);
  const runRows = artworkRows.flatMap((row) => row.edition_runs ?? []);
  const slotRows = (slotRes.data ?? []) as SlotRow[];

  const masterIds = [...new Set([...imageRows.map((row) => row.asset_id), ...slotRows.map((row) => row.asset_id).filter((id): id is string => !!id)])];
  let assets: AssetRow[] = [];
  if (masterIds.length) {
    const list = masterIds.join(",");
    const assetRes = await db.from("assets").select("id, bucket, object_key, width_px, kind, master_asset_id").or(`id.in.(${list}),master_asset_id.in.(${list})`);
    if (assetRes.error) throw fail("image files", assetRes.error.message);
    assets = (assetRes.data ?? []) as AssetRow[];
  }
  const masters = new Map(assets.filter((asset) => asset.kind === "master").map((asset) => [asset.id, asset]));
  const derivatives = assets.filter((asset) => asset.kind === "derivative");

  const toImage = (row: ImageRow): CatalogueImage => ({
    id: row.id,
    assetId: row.asset_id,
    name: baseName(masters.get(row.asset_id)?.object_key ?? "image"),
    url: displayUrl(row.asset_id, derivatives) ?? "",
    role: row.role,
    altText: row.alt_text ?? "",
    focalX: Number(row.focal_x ?? 50),
    focalY: Number(row.focal_y ?? 50),
  });
  const toVariant = (row: VariantRow): CatalogueVariant => ({
    id: row.id, sku: row.sku, sizeLabel: row.size_label, frameOption: row.frame_option, priceCents: row.price_cents === null ? null : Number(row.price_cents), active: row.active,
  });

  const artworks: CatalogueArtwork[] = artworkRows.map((row) => {
    const run = runRows.find((item) => item.artwork_id === row.id);
    const editionRun: CatalogueEditionRun | null = run ? { runCode: run.run_code, maxCopies: run.max_copies, lowStockThreshold: run.low_stock_threshold } : null;
    return {
      id: row.id, sku: row.sku, slug: row.slug, title: row.title,
      collectionSlug: row.collection_id ? (slugById.get(row.collection_id) ?? null) : null,
      category: row.category ?? "Landscape", summary: row.summary ?? "", story: row.story ?? "",
      saleMode: row.sale_mode, editionKind: row.edition_kind, availabilityNote: row.availability_note ?? "",
      featured: row.featured, showRemaining: row.show_remaining, releaseStatus: row.release_status, publishedAt: row.published_at,
      images: imageRows.filter((image) => image.artwork_id === row.id).map(toImage),
      variants: variantRows.filter((variant) => variant.artwork_id === row.id).map(toVariant),
      editionRun,
    };
  });

  // The places on the site are fixed by the design; the rows only say which picture is in each.
  const slots: MediaSlot[] = SLOT_DEFINITIONS.map((definition) => {
    const row = slotRows.find((item) => item.slot_key === definition.key);
    return {
      ...definition,
      assetId: row?.asset_id ?? null,
      imageUrl: row?.asset_id ? displayUrl(row.asset_id, derivatives) : null,
      altText: row?.alt_text ?? "",
      focalX: Number(row?.focal_x ?? 50),
      focalY: Number(row?.focal_y ?? 50),
    };
  });

  return { artworks, slots, collections };
}

/** The shape save_artwork() expects (migration 0007). Money is already in cents. */
export function toPayload(artwork: CatalogueArtwork) {
  return {
    id: artwork.id, sku: artwork.sku, slug: artwork.slug, title: artwork.title, collection_slug: artwork.collectionSlug,
    category: artwork.category, summary: artwork.summary, story: artwork.story, sale_mode: artwork.saleMode,
    edition_kind: artwork.editionKind, availability_note: artwork.availabilityNote, featured: artwork.featured,
    show_remaining: artwork.showRemaining, release_status: artwork.releaseStatus, published_at: artwork.publishedAt,
    edition_run: artwork.editionRun
      ? { run_code: artwork.editionRun.runCode, max_copies: artwork.editionRun.maxCopies, low_stock_threshold: artwork.editionRun.lowStockThreshold }
      : null,
    variants: artwork.variants.map((variant) => ({
      id: variant.id, sku: variant.sku, size_label: variant.sizeLabel, frame_option: variant.frameOption, price_cents: variant.priceCents, active: variant.active,
    })),
    images: artwork.images.map((image, index) => ({
      id: image.id, asset_id: image.assetId, role: image.role, alt_text: image.altText, focal_x: image.focalX, focal_y: image.focalY, sort_order: index,
    })),
  };
}

/** Database errors in words a person can act on. */
export function friendlyError(error: { code?: string; message: string }): string {
  switch (error.code) {
    case "23505": return "Another work already uses that web address or SKU. Change it and try again.";
    case "23503": return "This is used by an order, so it can't be removed. Switch it off instead.";
    case "42501": return "You don't have permission to change the catalogue. Ask the studio owner.";
    case "23514": return error.message; // our own publish-guard messages are already written for people
    case "23502": return "A required field is empty.";
    default:
      if (/row-level security/i.test(error.message)) return "You don't have permission to change the catalogue. Ask the studio owner.";
      return error.message || "Something went wrong. Try again.";
  }
}
