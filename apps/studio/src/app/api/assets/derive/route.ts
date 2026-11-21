import { createHash, randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const WIDTHS = [800, 1600, 2400];
const MAX_MASTER_BYTES = 30 * 1024 * 1024;
const EDITOR_ROLES = ["owner", "studio_manager"];
const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

/**
 * Turns a freshly uploaded PRIVATE original into public web-sized copies.
 *
 * 1. Verify the caller is signed in and is an owner or studio manager.
 * 2. Read the original from the private bucket as that person (so storage rules apply).
 * 3. Make WebP copies at 800, 1600 and 2400 px (never enlarging). Camera metadata, including GPS, is not carried over.
 * 4. Write the copies to the public bucket with the service key, and record original and copies in `assets`.
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail("The studio is not connected to the database.", 503);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Sign in again to upload images.", 401);

  const { data: memberships } = await supabase.from("workspace_memberships").select("workspace_id, role").eq("active", true);
  const membership = (memberships ?? []).find((row: { role: string }) => EDITOR_ROLES.includes(row.role)) as { workspace_id: string; role: string } | undefined;
  if (!membership) return fail("Only the owner or a studio manager can upload images.", 403);

  const admin = createSupabaseAdminClient();
  if (!admin) return fail("Image processing is not set up yet. The server needs SUPABASE_SERVICE_ROLE_KEY.", 503);

  const body = (await request.json().catch(() => null)) as { key?: string; name?: string } | null;
  const key = body?.key ?? "";
  const workspaceId = membership.workspace_id;
  // The original must sit inside this person's own workspace folder, with no path tricks.
  if (!key.startsWith(`${workspaceId}/uploads/`) || key.includes("..")) return fail("That file is not in your workspace.", 400);

  const download = await supabase.storage.from("artwork-masters").download(key);
  if (download.error || !download.data) return fail("The uploaded original could not be found.", 404);
  if (download.data.size > MAX_MASTER_BYTES) return fail("That image is too large to process (30 MB limit).", 413);
  const input = Buffer.from(await download.data.arrayBuffer());

  let width: number;
  let height: number;
  try {
    const meta = await sharp(input).metadata();
    if (!meta.width || !meta.height) throw new Error("no size");
    const turned = (meta.orientation ?? 1) >= 5; // phones store rotated pictures with an orientation flag
    width = turned ? meta.height : meta.width;
    height = turned ? meta.width : meta.height;
  } catch {
    return fail("That file is not a readable image.", 415);
  }

  const assetId = randomUUID();
  const sizes = WIDTHS.filter((w) => w <= width);
  if (sizes.length === 0) sizes.push(width);

  const uploadedPaths: string[] = [];
  const derivativeRows: Array<Record<string, unknown>> = [];
  try {
    for (const target of sizes) {
      const { data, info } = await sharp(input).rotate().resize({ width: target, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
      const path = `${workspaceId}/derivatives/${assetId}/w${info.width}.webp`;
      const put = await admin.storage.from("artwork-public").upload(path, data, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
      if (put.error) throw new Error(put.error.message);
      uploadedPaths.push(path);
      derivativeRows.push({
        id: randomUUID(), workspace_id: workspaceId, kind: "derivative", master_asset_id: assetId, bucket: "artwork-public",
        object_key: path, mime_type: "image/webp", size_bytes: info.size, width_px: info.width, height_px: info.height, visibility: "public", uploaded_by: user.id,
      });
    }

    const master = {
      id: assetId, workspace_id: workspaceId, kind: "master", bucket: "artwork-masters", object_key: key,
      mime_type: download.data.type || "application/octet-stream", size_bytes: input.length, width_px: width, height_px: height,
      checksum_sha256: createHash("sha256").update(input).digest("hex"), visibility: "private", uploaded_by: user.id,
    };
    const insertMaster = await supabase.from("assets").insert(master);
    if (insertMaster.error) throw new Error(insertMaster.error.message);
    const insertCopies = await supabase.from("assets").insert(derivativeRows);
    if (insertCopies.error) {
      await supabase.from("assets").delete().eq("id", assetId);
      throw new Error(insertCopies.error.message);
    }
  } catch (problem) {
    if (uploadedPaths.length) await admin.storage.from("artwork-public").remove(uploadedPaths);
    return fail(`The image could not be processed. ${problem instanceof Error ? problem.message : ""}`.trim(), 500);
  }

  // Show the copy closest to 1600 px wide.
  const shown = derivativeRows.reduce((best, row) => (Math.abs(Number(row.width_px) - 1600) < Math.abs(Number(best.width_px) - 1600) ? row : best));
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return NextResponse.json({ assetId, url: `${base}/storage/v1/object/public/artwork-public/${shown.object_key}`, width, height });
}
