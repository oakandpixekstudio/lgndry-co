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
for (const f of ["0001_core_identity", "0002_catalogue_and_media", "0003_customers_orders_storefront", "0005_publish_guard_and_grants", "0006_staff_self_read", "0007_catalogue_save_and_scheduling", "0008_storefront_views_for_the_website", "0009_website_intake", "0010_staff_add_customers", "0011_bookings"]) {
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

// ───── what the website reads (migration 0008) ─────
// The published work (Dune) gets two public web copies of its cover. The website must see both, tagged with the
// picture they belong to; a collection with a live work shows without being separately published; private
// originals never appear.
await db.exec(`
  insert into assets (id, workspace_id, kind, master_asset_id, bucket, object_key, mime_type, size_bytes, width_px, visibility) values
    ('e0000000-0000-0000-0000-000000000001','${ws}','derivative','a0000000-0000-0000-0000-000000000002','artwork-public','${ws}/derivatives/b/w800.webp','image/webp',10,800,'public'),
    ('e0000000-0000-0000-0000-000000000002','${ws}','derivative','a0000000-0000-0000-0000-000000000002','artwork-public','${ws}/derivatives/b/w1600.webp','image/webp',10,1600,'public');
  grant select on all tables in schema public to anon;
`);
await db.exec("set role anon;");
const imgRows = (await db.query("select image_id, width_px::int w, bucket from storefront_artwork_images where artwork_id = $1 order by width_px", [A1])).rows;
const collectionSlugs = (await db.query("select slug from storefront_collections order by slug")).rows.map((x) => x.slug);
await db.exec("reset role;");
ok("website sees both web copies of the cover, tagged with the same picture id", imgRows.length === 2 && imgRows[0].image_id === imgRows[1].image_id, JSON.stringify(imgRows));
ok("website never sees a private original", imgRows.length > 0 && imgRows.every((x) => x.bucket === "artwork-public"));
ok("a collection with a live work shows without being separately published", collectionSlugs.includes("open-editions"), collectionSlugs.join(","));
ok("a collection with no live work stays hidden", !collectionSlugs.includes("collectors-editions"), collectionSlugs.join(","));

// ───── website enquiries and newsletter (migration 0009) ─────
// Only the website's server (service role) may call the intake functions. Everything else is refused.
const intake = async (role, fn, payload) => {
  await db.exec(`set role ${role};`);
  try {
    const r = await db.query(`select public.${fn}($1::jsonb) as v`, [JSON.stringify(payload)]);
    return { ok: true, v: r.rows[0].v };
  } catch (e) {
    return { ok: false, error: e.message };
  } finally {
    await db.exec("reset role;");
  }
};
const visitor = (over = {}) => ({ name: "Thandi Nkosi", email: "Thandi@Example.com ", message: "Is this still available?", category: "availability", artwork_slug: "dune", ip_hash: "ip-1", ...over });

r = await intake("service_role", "intake_enquiry", visitor());
ok("a valid enquiry is accepted and gets a reference", r.ok && /^ENQ-\d{4}-0001$/.test(r.v), r.error ?? r.v);
const enq1 = (await db.query("select * from enquiries where enquiry_ref = $1", [r.v])).rows[0];
ok("the email is stored lower-case and trimmed, status is new, source is website", enq1?.contact_email === "thandi@example.com" && enq1.status === "new" && enq1.source === "website");
ok("the enquiry is linked to the work it was about", enq1?.artwork_id === A1);
ok("a customer was created for the visitor", (await count("select count(*)::int c from customers where primary_email_normalized = 'thandi@example.com'")) === 1);

r = await intake("service_role", "intake_enquiry", visitor({ message: "Second question", ip_hash: "ip-2" }));
ok("a second enquiry reuses the same customer", r.ok && (await count("select count(*)::int c from customers where primary_email_normalized = 'thandi@example.com'")) === 1, r.error);
ok("the second enquiry gets the next reference", r.ok && /-0002$/.test(r.v), r.v);

for (const [label, patch] of [["a bad email", { email: "not-an-email" }], ["a missing name", { name: "  " }], ["an empty message", { message: "" }], ["a message over 5000 characters", { message: "x".repeat(5001) }]]) {
  r = await intake("service_role", "intake_enquiry", visitor({ ...patch, email: patch.email ?? "other@example.com", ip_hash: "ip-3" }));
  ok(`${label} is refused`, !r.ok && /invalid_input/.test(r.error), r.error);
}
r = await intake("service_role", "intake_enquiry", visitor({ category: "mystery", email: "cat@example.com", ip_hash: "ip-4" }));
ok("an unknown category falls back to general", r.ok && (await count("select count(*)::int c from enquiries where enquiry_ref = $1 and category = 'general'", [r.v])) === 1, r.error);

for (let i = 0; i < 3; i++) await intake("service_role", "intake_enquiry", visitor({ ip_hash: "ip-5" })); // thandi: now at 5 in the hour
r = await intake("service_role", "intake_enquiry", visitor({ ip_hash: "ip-6" }));
ok("a sixth enquiry from one email in an hour is refused", !r.ok && /rate_limited/.test(r.error), r.error);
for (let i = 0; i < 10; i++) await intake("service_role", "intake_enquiry", visitor({ email: `flood${i}@example.com`, ip_hash: "ip-flood" }));
r = await intake("service_role", "intake_enquiry", visitor({ email: "flood-more@example.com", ip_hash: "ip-flood" }));
ok("an eleventh enquiry from one visitor in an hour is refused", !r.ok && /rate_limited/.test(r.error), r.error);

for (const role of ["anon", "authenticated"]) {
  r = await intake(role, "intake_enquiry", visitor({ email: "sneaky@example.com", ip_hash: "ip-7" }));
  ok(`${role} cannot submit an enquiry directly`, !r.ok && /permission denied/i.test(r.error), r.error);
  r = await intake(role, "intake_newsletter", { email: "sneaky@example.com" });
  ok(`${role} cannot sign anyone up directly`, !r.ok && /permission denied/i.test(r.error), r.error);
}

r = await intake("service_role", "intake_newsletter", { email: "Reader@Example.com", ip_hash: "ip-8" });
ok("a newsletter sign-up is accepted", r.ok, r.error);
r = await intake("service_role", "intake_newsletter", { email: "reader@example.com", ip_hash: "ip-8" });
ok("signing up twice records consent once", r.ok && (await count("select count(*)::int c from consents c join customers u on u.id = c.customer_id where u.primary_email_normalized = 'reader@example.com' and c.purpose = 'marketing_email'")) === 1, r.error);
r = await intake("service_role", "intake_newsletter", { email: "nope" });
ok("a bad newsletter email is refused", !r.ok && /invalid_input/.test(r.error), r.error);
r = await intake("service_role", "intake_enquiry", visitor({ name: "Reader Reed", email: "reader@example.com", ip_hash: "ip-9" }));
ok("an enquiry from a newsletter subscriber adds their real name, no duplicate customer",
  r.ok && (await count("select count(*)::int c from customers where primary_email_normalized = 'reader@example.com'")) === 1
  && (await count("select count(*)::int c from customers where primary_email_normalized = 'reader@example.com' and display_name = 'Reader Reed'")) === 1, r.error);

const ownerSees = await as(staff, async () => count("select count(*)::int c from enquiries"));
ok("the owner can read enquiries", ownerSees >= 5, String(ownerSees));
const photogSees = await as(photog, async () => count("select count(*)::int c from enquiries"));
ok("a photographer cannot read enquiries", photogSees === 0, String(photogSees));
const strangerSees = await as(stranger, async () => count("select count(*)::int c from enquiries"));
ok("a non-member cannot read enquiries", strangerSees === 0, String(strangerSees));
const ownerUpdates = await as(staff, async () => {
  await db.query("update enquiries set status = 'in_progress' where id = $1", [enq1.id]);
  return count("select count(*)::int c from enquiries where id = $1 and status = 'in_progress'", [enq1.id]);
});
ok("the owner can change an enquiry's status", ownerUpdates === 1, String(ownerUpdates));

// ───── customers added by hand and archived (migration 0010) ─────
const addCustomer = (uid, name, email) =>
  as(uid, async () => {
    try {
      await db.query("insert into customers (workspace_id, display_name, primary_email_normalized, source) values ($1, $2, $3, 'manual')", [ws, name, email]);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });
r = await addCustomer(staff, "Walk-in Buyer", "walkin@example.com");
ok("the owner can add a customer by hand", r.ok, r.error);
r = await addCustomer(staff, "Walk-in Again", "walkin@example.com");
ok("the same email cannot be added twice", !r.ok && /duplicate key|unique/i.test(r.error), r.error);
r = await addCustomer(photog, "Sneaky Add", "sneaky-add@example.com");
ok("a photographer cannot add a customer", !r.ok && /row-level security/i.test(r.error), r.error);
r = await addCustomer(stranger, "Stranger Add", "stranger-add@example.com");
ok("a non-member cannot add a customer", !r.ok && /row-level security|permission denied/i.test(r.error), r.error);
const walkId = (await db.query("select id from customers where primary_email_normalized = 'walkin@example.com'")).rows[0].id;
const notesSaved = await as(staff, async () => {
  await db.query("update customers set notes = 'Prefers email', segment = 'Collector' where id = $1", [walkId]);
  return count("select count(*)::int c from customers where id = $1 and notes = 'Prefers email'", [walkId]);
});
ok("the owner can save notes on a customer", notesSaved === 1, String(notesSaved));
await as(staff, async () => db.query("update customers set archived_at = now() where id = $1", [walkId]));
r = await addCustomer(staff, "Walk-in Returns", "walkin@example.com");
ok("an archived customer's email can be used again", r.ok, r.error);
const photogDeletes = await as(photog, async () => {
  try {
    await db.query("delete from customers where id = $1", [walkId]);
    return "allowed";
  } catch (e) {
    return "refused";
  }
});
ok("nobody can delete a customer through the app", photogDeletes === "refused");
const ownerDeletes = await as(staff, async () => {
  try {
    await db.query("delete from customers where id = $1", [walkId]);
    return "allowed";
  } catch (e) {
    return "refused";
  }
});
ok("not even the owner can delete a customer (they are archived instead)", ownerDeletes === "refused");

// ───────── bookings (0011) ─────────
const bookCust = (await db.query("select id from customers where primary_email_normalized = 'walkin@example.com' and archived_at is null")).rows[0].id;
const tryDb = (uid, sql, params = []) =>
  as(uid, async () => {
    try {
      const res = await db.query(sql, params);
      return { ok: true, rows: res.rows };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });
const newBooking = (uid, title = "Portrait Series") =>
  tryDb(uid, "insert into booking_requests (workspace_id, customer_id, title, service_type) values ($1, $2, $3, 'Portrait') returning id, booking_ref, status", [ws, bookCust, title]);

r = await newBooking(staff);
ok("the owner can create a booking", r.ok, r.error);
const bk1 = r.rows?.[0];
ok("a booking gets a reference like BK-YYYY-0001 and starts as requested", /^BK-\d{4}-0001$/.test(bk1?.booking_ref ?? "") && bk1?.status === "requested", bk1?.booking_ref);
r = await newBooking(staff, "Brand Campaign");
ok("the next booking gets the next number", /-0002$/.test(r.rows?.[0]?.booking_ref ?? ""), r.rows?.[0]?.booking_ref);
r = await newBooking(photog);
ok("a photographer cannot create a booking", !r.ok && /row-level security/i.test(r.error), r.error);
r = await newBooking(stranger);
ok("a non-member cannot create a booking", !r.ok && /row-level security|permission denied/i.test(r.error), r.error);
r = await tryDb(staff, "insert into booking_requests (workspace_id, customer_id, title, preferred_start_at, preferred_end_at) values ($1, $2, 'Backwards', '2026-12-02 12:00+02', '2026-12-02 09:00+02')", [ws, bookCust]);
ok("a shoot cannot end before it starts", !r.ok && /check constraint/i.test(r.error), r.error);
r = await tryDb(staff, "insert into booking_requests (workspace_id, customer_id, title) values ($1, $2, '   ')", [ws, bookCust]);
ok("a booking needs a title", !r.ok && /check constraint/i.test(r.error), r.error);

await tryDb(staff, "update booking_requests set status = 'confirmed' where id = $1", [bk1.id]);
let ms = (await db.query("select confirmed_at, completed_at, cancelled_at from booking_requests where id = $1", [bk1.id])).rows[0];
ok("confirming a booking stamps the confirmed time", ms.confirmed_at !== null && ms.completed_at === null);
await tryDb(staff, "update booking_requests set status = 'completed' where id = $1", [bk1.id]);
ms = (await db.query("select completed_at from booking_requests where id = $1", [bk1.id])).rows[0];
ok("completing a booking stamps the completed time", ms.completed_at !== null);
await tryDb(staff, "update booking_requests set status = 'cancelled' where id = $1", [bk1.id]);
ms = (await db.query("select cancelled_at from booking_requests where id = $1", [bk1.id])).rows[0];
ok("cancelling a booking stamps the cancelled time", ms.cancelled_at !== null);

r = await tryDb(photog, "select id from booking_requests");
ok("a photographer sees no bookings unless they are assigned", r.ok && r.rows.length === 0, String(r.rows?.length));
await db.query("update booking_requests set assignee_id = $1 where id = $2", [photog, bk1.id]);
r = await tryDb(photog, "select id from booking_requests");
ok("a photographer sees a booking once it is assigned to them", r.ok && r.rows.length === 1, String(r.rows?.length));
r = await tryDb(photog, "update booking_requests set status = 'in_progress' where id = $1 returning id", [bk1.id]);
ok("a photographer cannot change a booking", !r.ok || r.rows.length === 0);
r = await tryDb(stranger, "select id from booking_requests");
ok("a non-member sees no bookings", !r.ok || r.rows.length === 0);
r = await tryDb(staff, "delete from booking_requests where id = $1", [bk1.id]);
ok("not even the owner can delete a booking (it is cancelled instead)", !r.ok && /permission denied/i.test(r.error), r.error);

console.log(results.join("\n"));
if (results.some((line) => line.startsWith("FAIL"))) process.exit(1);
