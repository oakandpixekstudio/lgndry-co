import { cacheLife, cacheTag } from "next/cache";
import { COLLECTIONS, WORKS, type Collection, type Tone, type Work, type WorkVariant } from "@/lib/catalogue";
import { collectionFromLabel, makeCatalogue, type Catalogue, type CatalogueSnapshot, type SlotImage } from "@/lib/catalogue-model";

/**
 * Where the site's catalogue comes from.
 *
 *   CATALOGUE_SOURCE=database  -> the Studio Desk database, through the public read-only `storefront_*` views
 *   anything else (default)    -> the built-in prototype catalogue, exactly as before
 *
 * The switch is explicit so deploying this code changes nothing until it is turned on.
 * Only PUBLIC values are used here: the project address and the anon key. The anon key can read the
 * storefront views and nothing else (row-level security), so it is safe even if it leaks.
 */

const STATIC_SNAPSHOT: CatalogueSnapshot = { works: WORKS, collections: COLLECTIONS, slots: {}, source: "static" };

interface ViewArtwork {
  id: string; slug: string; title: string; collection_slug: string | null; category: string | null; summary: string | null;
  story: string | null; sale_mode: "buy" | "enquire"; edition_kind: "open" | "limited"; availability_note: string | null;
  tone: string | null; focal_x: number | null; focal_y: number | null; featured: boolean; sort_order: number;
  published_at: string | null; copies_remaining: number | null; edition_size: number | null;
}
interface ViewImage {
  artwork_id: string; image_id: string; role: string; alt_text: string | null; focal_x: number | null; focal_y: number | null;
  sort_order: number; bucket: string; object_key: string; width_px: number | null;
}
interface ViewVariant { artwork_id: string; size_label: string; frame_option: string; price_cents: number | null }
interface ViewCollection { slug: string; title: string; kicker: string | null; intro: string | null; edition_label: string | null; price_note: string | null; sort_order: number }
interface ViewSlot { slot_key: string; alt_text: string | null; focal_x: number | null; focal_y: number | null; bucket: string; object_key: string; width_px: number | null }

function connection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("CATALOGUE_SOURCE is 'database' but the Supabase address or anon key is missing.");
  return { url: url.replace(/\/$/, ""), key };
}

async function readView<T>(view: string, query = "select=*"): Promise<T[]> {
  const { url, key } = connection();
  const response = await fetch(`${url}/rest/v1/${view}?${query}`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" });
  if (!response.ok) throw new Error(`Could not read ${view} (${response.status}).`);
  return (await response.json()) as T[];
}

const publicUrl = (bucket: string, key: string) => `${connection().url}/storage/v1/object/public/${bucket}/${key}`;
const focalOf = (x: number | null, y: number | null) => (x === null || y === null ? undefined : `${Math.round(Number(x))}% ${Math.round(Number(y))}%`);
const TONES: Tone[] = ["earth", "ritual", "road", "portrait", "form", "structure"];

/** Several web copies exist per picture (800, 1600, 2400 px). Use the largest; Next.js shrinks it per screen. */
function widest<T extends { width_px: number | null }>(rows: T[]): T {
  return rows.reduce((best, row) => ((row.width_px ?? 0) > (best.width_px ?? 0) ? row : best));
}

async function loadFromDatabase(): Promise<CatalogueSnapshot> {
  const [artworks, images, variants, collectionRows, slotRows] = await Promise.all([
    readView<ViewArtwork>("storefront_artworks", "select=*&order=sort_order.asc,published_at.desc"),
    readView<ViewImage>("storefront_artwork_images", "select=*&order=sort_order.asc"),
    readView<ViewVariant>("storefront_variants", "select=*"),
    readView<ViewCollection>("storefront_collections", "select=*&order=sort_order.asc"),
    readView<ViewSlot>("storefront_media_slots", "select=*"),
  ]);

  const works: Work[] = [];
  for (const row of artworks) {
    if (!row.collection_slug) continue; // a work with no collection has nowhere to live on the site
    const mine = images.filter((image) => image.artwork_id === row.id);
    const byImage = new Map<string, ViewImage[]>();
    for (const image of mine) byImage.set(image.image_id, [...(byImage.get(image.image_id) ?? []), image]);
    const pictures = [...byImage.values()].map((copies) => ({ ...widest(copies) }));
    const cover = pictures.find((picture) => picture.role === "cover") ?? pictures[0];
    if (!cover) continue; // the studio's publish guard requires a cover; skip anything that slipped through

    const sizes: WorkVariant[] = variants
      .filter((variant) => variant.artwork_id === row.id)
      .map((variant) => ({ size: variant.size_label, finish: variant.frame_option, price: variant.price_cents === null ? null : Math.round(Number(variant.price_cents) / 100) }));
    const prices = sizes.map((variant) => variant.price).filter((price): price is number => price !== null);

    works.push({
      slug: row.slug,
      title: row.title,
      collection: row.collection_slug,
      category: row.category ?? "Landscape",
      image: publicUrl(cover.bucket, cover.object_key),
      imageAlt: cover.alt_text ?? undefined,
      focal: focalOf(cover.focal_x ?? row.focal_x, cover.focal_y ?? row.focal_y),
      tone: TONES.includes(row.tone as Tone) ? (row.tone as Tone) : "earth",
      price: prices.length ? Math.min(...prices) : null,
      mode: row.sale_mode,
      edition: row.edition_kind === "open" ? { kind: "open" } : { kind: "limited", size: row.edition_size },
      summary: row.summary ?? "",
      story: row.story ?? "",
      availabilityNote: row.availability_note ?? undefined,
      featured: row.featured,
      variants: sizes,
      remaining: row.copies_remaining,
    });
  }

  const collections: Collection[] = collectionRows.map((row) => ({
    slug: row.slug,
    title: row.title,
    kicker: row.kicker ?? "",
    intro: row.intro ?? "",
    edition: row.edition_label ?? "",
    from: row.price_note ?? collectionFromLabel(works.filter((work) => work.collection === row.slug)),
  }));

  const slots: Record<string, SlotImage> = {};
  for (const key of new Set(slotRows.map((row) => row.slot_key))) {
    const best = widest(slotRows.filter((row) => row.slot_key === key));
    slots[key] = { src: publicUrl(best.bucket, best.object_key), alt: best.alt_text ?? "", focal: focalOf(best.focal_x, best.focal_y) };
  }

  return { works, collections, slots, source: "database" };
}

/**
 * The catalogue snapshot, cached and refreshed every five minutes, or at once when /api/revalidate is called.
 * If the database cannot be read the error is thrown (not swallowed), so an empty shop is never cached by mistake.
 */
export async function getCatalogueSnapshot(): Promise<CatalogueSnapshot> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 86_400 });
  cacheTag("catalogue");
  if (process.env.CATALOGUE_SOURCE !== "database") return STATIC_SNAPSHOT;
  return loadFromDatabase();
}

export async function getCatalogue(): Promise<Catalogue> {
  return makeCatalogue(await getCatalogueSnapshot());
}
