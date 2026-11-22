import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const GRACE_MS = 24 * 60 * 60 * 1000; // a picture uploaded today may belong to a work that has not been saved yet
const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

interface AssetRow { id: string; kind: "master" | "derivative"; master_asset_id: string | null; bucket: string; object_key: string; size_bytes: number; created_at: string }
interface UnusedFile { bucket: string; path: string; bytes: number; kind: "original" | "web copy" | "stray upload" }

/**
 * Unused picture files, found two ways:
 *  - an original nobody uses (no work or website place points at it) older than a day, plus its web-sized copies
 *  - a file sitting in the uploads folder that was never turned into a picture record (a failed upload), older than a day
 * Nothing in use can be returned: the original must be absent from every artwork image and website place.
 */
async function findUnused(admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>, workspaceId: string) {
  const cutoff = Date.now() - GRACE_MS;
  const [assets, images, slots] = await Promise.all([
    admin.from("assets").select("id, kind, master_asset_id, bucket, object_key, size_bytes, created_at").eq("workspace_id", workspaceId).limit(10000),
    admin.from("artwork_images").select("asset_id").limit(20000),
    admin.from("media_slots").select("asset_id").eq("workspace_id", workspaceId).not("asset_id", "is", null),
  ]);
  for (const res of [assets, images, slots]) if (res.error) throw new Error(res.error.message || res.error.code || "database error");

  const rows = (assets.data ?? []) as AssetRow[];
  const inUse = new Set<string>([...(images.data ?? []).map((r) => r.asset_id as string), ...(slots.data ?? []).map((r) => r.asset_id as string)]);
  // A picture is in use if the thing referenced is the original OR one of its copies.
  const usedMasters = new Set<string>();
  for (const row of rows) if (inUse.has(row.id)) usedMasters.add(row.kind === "master" ? row.id : (row.master_asset_id as string));

  const orphanMasters = rows.filter((row) => row.kind === "master" && !usedMasters.has(row.id) && new Date(row.created_at).getTime() < cutoff);
  const orphanIds = new Set(orphanMasters.map((row) => row.id));
  const orphanRows = rows.filter((row) => orphanIds.has(row.id) || (row.master_asset_id && orphanIds.has(row.master_asset_id)));

  const files: UnusedFile[] = orphanRows.map((row) => ({ bucket: row.bucket, path: row.object_key, bytes: Number(row.size_bytes), kind: row.kind === "master" ? "original" : "web copy" }));

  // Stray uploads: in the private uploads folder but never recorded.
  const known = new Set(rows.filter((row) => row.bucket === "artwork-masters").map((row) => row.object_key));
  const folder = `${workspaceId}/uploads`;
  const listed = await admin.storage.from("artwork-masters").list(folder, { limit: 1000, sortBy: { column: "created_at", order: "asc" } });
  if (listed.error) throw new Error(listed.error.message);
  for (const file of listed.data ?? []) {
    const path = `${folder}/${file.name}`;
    const made = file.created_at ? new Date(file.created_at).getTime() : Date.now();
    if (file.id && !known.has(path) && made < cutoff) files.push({ bucket: "artwork-masters", path, bytes: Number((file.metadata as { size?: number } | null)?.size ?? 0), kind: "stray upload" });
  }
  return { files, orphanIds: [...orphanIds], orphanRowIds: orphanRows.map((row) => row.id) };
}

async function authorise() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: fail("The studio is not connected to the database.", 503) };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: fail("Sign in again.", 401) };
  const { data: memberships } = await supabase.from("workspace_memberships").select("workspace_id, role").eq("active", true);
  const owner = (memberships ?? []).find((row: { role: string }) => row.role === "owner") as { workspace_id: string } | undefined;
  if (!owner) return { error: fail("Only the studio owner can tidy up files.", 403) };
  const admin = createSupabaseAdminClient();
  if (!admin) return { error: fail("File tidy-up is not set up yet. The server needs SUPABASE_SERVICE_ROLE_KEY.", 503) };
  return { admin, workspaceId: owner.workspace_id, userId: user.id };
}

const summarise = (files: UnusedFile[]) => ({
  count: files.length,
  bytes: files.reduce((total, file) => total + file.bytes, 0),
  originals: files.filter((file) => file.kind === "original").length,
  strays: files.filter((file) => file.kind === "stray upload").length,
  sample: files.filter((file) => file.kind !== "web copy").slice(0, 20).map((file) => ({ name: file.path.split("/").pop() ?? file.path, kind: file.kind, bytes: file.bytes })),
});

/** A report only. Nothing is changed. */
export async function GET() {
  const auth = await authorise();
  if ("error" in auth) return auth.error;
  try {
    const { files } = await findUnused(auth.admin, auth.workspaceId);
    return NextResponse.json(summarise(files));
  } catch (problem) {
    return fail(`The check could not finish. ${problem instanceof Error ? problem.message : ""}`.trim(), 500);
  }
}

/**
 * Deletes the unused files. The list is worked out again on the server (never taken from the browser) and only runs
 * with an explicit confirm. Records go first, then files, so a failure part-way leaves harmless strays, never a record
 * pointing at nothing. The database itself refuses to remove anything a work or website place still points at.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { confirm?: boolean } | null;
  if (body?.confirm !== true) return fail("Confirm the tidy-up first.", 400);
  const auth = await authorise();
  if ("error" in auth) return auth.error;
  const { admin, workspaceId, userId } = auth;

  try {
    const { files, orphanRowIds } = await findUnused(admin, workspaceId);
    if (files.length === 0) return NextResponse.json({ deleted: 0, bytes: 0 });

    if (orphanRowIds.length) {
      const removed = await admin.from("assets").delete().in("id", orphanRowIds);
      if (removed.error) throw new Error(removed.error.message);
    }
    for (const bucket of ["artwork-masters", "artwork-public"]) {
      const paths = files.filter((file) => file.bucket === bucket).map((file) => file.path);
      for (let i = 0; i < paths.length; i += 100) {
        const gone = await admin.storage.from(bucket).remove(paths.slice(i, i + 100));
        if (gone.error) throw new Error(gone.error.message);
      }
    }
    const summary = summarise(files);
    await admin.from("audit_events").insert({
      workspace_id: workspaceId, actor_user_id: userId, entity_type: "assets", action: "tidy_unused_files",
      after_redacted: { files: summary.count, bytes: summary.bytes, originals: summary.originals, strays: summary.strays },
    });
    return NextResponse.json({ deleted: summary.count, bytes: summary.bytes });
  } catch (problem) {
    return fail(`The tidy-up stopped part-way. ${problem instanceof Error ? problem.message : ""} Run the check again to see what is left.`.trim(), 500);
  }
}
