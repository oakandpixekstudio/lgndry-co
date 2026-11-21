import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

/**
 * Runs migrations 0001-0003 and 0005-0007 on a throwaway in-memory Postgres (PGlite) and checks the catalogue rules:
 * saving, publishing guards, scheduling, edition runs and who may do what (row-level security).
 * Needs no Supabase project and changes nothing. Run:  pnpm --filter @lgndry/database test:db
 *
 * Not covered here: 0004 (storage buckets exist only on Supabase). Use tests/smoke_0004_0005.sql for that.
 * Supabase-specific pieces (the auth schema, auth.uid(), the roles) are stubbed at the top.
 */

const dir = fileURLToPath(new URL("../../migrations/", import.meta.url));
const db = new PGlite();
const results = [];
const ok = (name, cond, extra = "") => {
  results.push(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);
};

await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to authenticated, anon;
  grant usage on schema public to authenticated, anon;
`);
for (const f of ["0001_core_identity", "0002_catalogue_and_media", "0003_customers_orders_storefront", "0005_publish_guard_and_grants", "0006_staff_self_read", "0007_catalogue_save_and_scheduling"]) {
  try {
    await db.exec(fs.readFileSync(dir + f + ".sql", "utf8"));
    results.push(`applied ${f}`);
  } catch (e) {
    results.push(`FAIL applying ${f}: ${e.message}`);
    console.log(results.join("\n"));
    process.exit(1);
  }
}

const staff = "11111111-1111-1111-1111-111111111111";
const photog = "22222222-2222-2222-2222-222222222222";
const stranger = "33333333-3333-3333-3333-333333333333";
const ws = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
await db.exec(`
  insert into auth.users (id, email) values ('${staff}','s@x.test'),('${photog}','p@x.test'),('${stranger}','z@x.test');
  insert into workspaces (id, slug, name) values ('${ws}','lgndry','LGNDRY.Co');
  insert into workspace_memberships (workspace_id, user_id, role) values ('${ws}','${staff}','owner'),('${ws}','${photog}','photographer');
  insert into collections (workspace_id, slug, title) values ('${ws}','open-editions','Open Editions'),('${ws}','collectors-editions','Collectors Editions');
  insert into assets (id, workspace_id, kind, bucket, object_key, mime_type, size_bytes) values
    ('a0000000-0000-0000-0000-000000000001','${ws}','master','artwork-masters','${ws}/a.jpg','image/jpeg',10),
    ('a0000000-0000-0000-0000-000000000002','${ws}','master','artwork-masters','${ws}/b.jpg','image/jpeg',10);
`);

const as = async (uid, fn) => {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${uid}',false);`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role;");
  }
};
const call = (uid, payload) =>
  as(uid, async () => {
    try {
      const r = await db.query("select public.save_artwork($1::uuid,$2::jsonb) as id", [ws, JSON.stringify(payload)]);
      return { ok: true, id: r.rows[0].id };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });
const count = async (sql, params = []) => (await db.query(sql, params)).rows[0].c;

const A1 = "b0000000-0000-0000-0000-000000000001";
const base = (over = {}) => ({
  id: A1, sku: "LGN-0001", slug: "dune", title: "Dune", collection_slug: "open-editions", category: "Landscape",
  summary: "s", story: "t", sale_mode: "buy", edition_kind: "open", availability_note: "", featured: false,
  show_remaining: false, release_status: "draft", published_at: null, edition_run: null,
  variants: [{ id: "c0000000-0000-0000-0000-000000000001", sku: "LGN-0001-A3", size_label: "A3", frame_option: "Unframed", price_cents: 390000, active: true }],
  images: [{ id: "d0000000-0000-0000-0000-000000000001", asset_id: "a0000000-0000-0000-0000-000000000001", role: "cover", alt_text: "", focal_x: 50, focal_y: 50, sort_order: 0 }],
  ...over,
});

let r = await call(staff, base());
ok("draft with empty alt text saves", r.ok, r.error);
r = await call(staff, base({ release_status: "published", published_at: "2026-01-01T00:00:00Z" }));
ok("publish with empty alt text blocked", !r.ok, r.error?.slice(0, 70));

const good = base({ release_status: "published", published_at: "2026-01-01T00:00:00Z" });
good.images[0].alt_text = "A dune";
r = await call(staff, good);
ok("publish a complete work", r.ok, r.error);
r = await call(staff, { ...good, title: "Dune II" });
ok("re-save a published work", r.ok, r.error);

const swap = {
  ...good,
  images: [
    { id: "d0000000-0000-0000-0000-000000000002", asset_id: "a0000000-0000-0000-0000-000000000002", role: "cover", alt_text: "Second", focal_x: 10, focal_y: 20, sort_order: 0 },
    { ...good.images[0], role: "gallery", sort_order: 1 },
  ],
};
r = await call(staff, swap);
ok("swap the cover image in one save", r.ok, r.error);
r = await call(staff, { ...good, images: [] });
ok("published work cannot lose its cover", !r.ok, r.error?.slice(0, 70));
r = await call(staff, { ...good, variants: [{ ...good.variants[0], price_cents: null }] });
ok("published work cannot lose its only price", !r.ok, r.error?.slice(0, 70));

const ltd = {
  ...good, id: "b0000000-0000-0000-0000-000000000002", sku: "LGN-0002", slug: "ltd", edition_kind: "limited",
  edition_run: { run_code: "R1", max_copies: 25, low_stock_threshold: 5 }, release_status: "draft", published_at: null,
  variants: [{ id: "c0000000-0000-0000-0000-000000000002", sku: "LGN-0002-A3", size_label: "A3", frame_option: "Unframed", price_cents: 840000, active: true }],
  images: [{ ...good.images[0], id: "d0000000-0000-0000-0000-000000000003" }],
};
r = await call(staff, ltd);
ok("limited draft saves with an edition run", r.ok, r.error);
ok("one active edition run", (await count("select count(*)::int c from edition_runs where artwork_id=$1 and retired_at is null", [ltd.id])) === 1);
r = await call(staff, { ...ltd, edition_run: { run_code: "R1", max_copies: 30, low_stock_threshold: 5 }, release_status: "published", published_at: "2026-01-01T00:00:00Z" });
ok("publish a limited edition", r.ok, r.error);
ok("run updated in place (30 copies)", (await count("select max_copies::int c from edition_runs where artwork_id=$1 and retired_at is null", [ltd.id])) === 30);

const ltd2 = {
  ...ltd, id: "b0000000-0000-0000-0000-000000000003", sku: "LGN-0003", slug: "ltd2",
  edition_run: { run_code: "R1", max_copies: 0, low_stock_threshold: 3 },
  variants: [{ ...ltd.variants[0], id: "c0000000-0000-0000-0000-000000000003", sku: "LGN-0003-A3" }],
  images: [{ ...ltd.images[0], id: "d0000000-0000-0000-0000-000000000004" }],
};
r = await call(staff, ltd2);
ok("limited draft with blank copies saves", r.ok, r.error);
r = await call(staff, { ...ltd2, release_status: "published", published_at: "2026-01-01T00:00:00Z" });
ok("publish a limited edition without a run blocked", !r.ok, r.error?.slice(0, 70));

const sched = (date) => ({
  ...good, id: "b0000000-0000-0000-0000-000000000004", sku: "LGN-0004", slug: "sched", release_status: "scheduled", published_at: date,
  variants: [{ ...good.variants[0], id: "c0000000-0000-0000-0000-000000000004", sku: "LGN-0004-A3" }],
  images: [{ ...good.images[0], id: "d0000000-0000-0000-0000-000000000005" }],
});
r = await call(staff, sched("2999-01-01T00:00:00Z"));
ok("schedule a future work", r.ok, r.error);
ok("future scheduled work is hidden from the website", (await count("select count(*)::int c from storefront_artworks where slug='sched'")) === 0);
r = await call(staff, sched("2020-01-01T00:00:00Z"));
ok("scheduled work shows once its date has passed", (await count("select count(*)::int c from storefront_artworks where slug='sched'")) === 1, r.error);

r = await call(staff, { ...ltd, edition_kind: "open", edition_run: null, release_status: "draft", published_at: null });
ok("switch a work to an open edition", r.ok, r.error);
ok("the run is retired, not deleted", (await count("select count(*)::int c from edition_runs where artwork_id=$1 and retired_at is null", [ltd.id])) === 0
  && (await count("select count(*)::int c from edition_runs where artwork_id=$1", [ltd.id])) === 1);

r = await call(photog, base({ id: "b0000000-0000-0000-0000-000000000009", sku: "LGN-0009", slug: "p" }));
ok("photographer cannot create a work", !r.ok, r.error?.slice(0, 60));
r = await call(stranger, base({ id: "b0000000-0000-0000-0000-000000000008", sku: "LGN-0008", slug: "z" }));
ok("non-member cannot create a work", !r.ok, r.error?.slice(0, 60));
const byPhotog = await as(photog, async () => count("select count(*)::int c from artworks"));
ok("photographer can read the catalogue", byPhotog >= 4, String(byPhotog));
const byStranger = await as(stranger, async () => count("select count(*)::int c from artworks"));
ok("non-member sees nothing", byStranger === 0, String(byStranger));

const del = (uid, id) =>
  as(uid, async () => {
    try {
      await db.query("select public.delete_draft_artwork($1::uuid)", [id]);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });
r = await del(staff, ltd.id);
ok("delete a draft", r.ok, r.error);
ok("the draft is gone", (await count("select count(*)::int c from artworks where id=$1", [ltd.id])) === 0);
r = await del(staff, A1);
ok("deleting a published work is blocked", !r.ok, r.error?.slice(0, 70));

await db.exec("set role anon;");
try {
  await db.query("select public.save_artwork($1::uuid,'{}'::jsonb)", [ws]);
  ok("anon cannot call save_artwork", false);
} catch {
  ok("anon cannot call save_artwork", true);
}
await db.exec("reset role;");

console.log(results.join("\n"));
if (results.some((line) => line.startsWith("FAIL"))) process.exit(1);
