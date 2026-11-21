-- LGNDRY.Co Studio Desk: smoke test for migrations 0004 (storage) and 0005 (publish guard and grants).
-- Run in the Supabase SQL Editor AFTER applying 0004 and 0005.
--
-- Safe to run: one DO block that always ends by raising an exception, which rolls back everything it created.
-- The exception text IS the report. A red error box starting "SMOKE TEST 0004/0005 RESULTS" is normal.

do $$
declare
  r text := '';
  ws uuid; art uuid; draft_art uuid; master uuid; run uuid; var uuid;
  staff uuid := gen_random_uuid();
  stranger uuid := gen_random_uuid();
  seen_staff integer; seen_stranger integer;
begin
  -- ───── storage ─────
  r := r || E'\n[1] Buckets (expect masters private, public public, documents private): ' || coalesce((
    select string_agg(id || '=' || case when public then 'public' else 'private' end, ', ' order by id)
      from storage.buckets where id in ('artwork-masters', 'artwork-public', 'documents')), 'MISSING');

  r := r || E'\n[2] Policies on storage.objects we added: ' || coalesce((
    select string_agg(policyname, ', ' order by policyname) from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
       and policyname in ('masters_staff_read','masters_editor_insert','masters_editor_update','masters_editor_delete','public_art_staff_list','documents_staff_read')), 'none');

  r := r || E'\n[3] Write policies on artwork-public for signed-in users (expect none  PASS): ' || coalesce((
    select string_agg(policyname || ':' || cmd, ', ') from pg_policies
     where schemaname = 'storage' and tablename = 'objects' and policyname like 'public_art%' and cmd <> 'SELECT'), 'none  (PASS)');

  r := r || E'\n[4] authenticated can use schema app: ' ||
    case when has_schema_privilege('authenticated', 'app', 'usage') then 'PASS' else 'FAIL' end;

  -- ───── fixture ─────
  insert into public.workspaces (slug, name) values ('smoke-0004', 'Smoke 0004') returning id into ws;
  insert into public.assets (workspace_id, kind, bucket, object_key, mime_type, size_bytes)
    values (ws, 'master', 'artwork-masters', ws || '/smoke/master.tif', 'image/tiff', 10) returning id into master;

  -- a draft with no cover cannot be published (proves the guard now reads the NEW row)
  insert into public.artworks (workspace_id, sku, slug, title) values (ws, 'G-DRAFT', 'g-draft', 'Draft') returning id into draft_art;
  begin
    update public.artworks set release_status = 'published', published_at = now() where id = draft_art;
    r := r || E'\n[5] Publish with no cover: FAIL (it was allowed)';
  exception when others then
    r := r || E'\n[5] Publish with no cover blocked: PASS  (' || sqlerrm || ')';
  end;

  -- a complete work publishes fine
  insert into public.artworks (workspace_id, sku, slug, title, sale_mode, edition_kind)
    values (ws, 'G-LTD', 'g-ltd', 'Limited', 'buy', 'limited') returning id into art;
  insert into public.artwork_images (artwork_id, asset_id, role, alt_text) values (art, master, 'cover', 'A sample picture');
  insert into public.edition_runs (artwork_id, run_code, max_copies) values (art, 'R1', 5) returning id into run;
  insert into public.artwork_variants (artwork_id, edition_run_id, sku, size_label, price_cents) values (art, run, 'G-LTD-A3', 'A3', 250000) returning id into var;
  begin
    update public.artworks set release_status = 'published', published_at = now() where id = art;
    r := r || E'\n[6] Publish a complete work: PASS';
  exception when others then
    r := r || E'\n[6] Publish a complete work: FAIL (' || sqlerrm || ')';
  end;

  -- the new protection: break a published work through its children (checked immediately here so the test can see it)
  set constraints all immediate;
  begin
    delete from public.artwork_images where artwork_id = art and role = 'cover';
    r := r || E'\n[7] Delete cover of a published work: FAIL (it was allowed)';
  exception when others then
    r := r || E'\n[7] Delete cover of a published work blocked: PASS';
  end;
  begin
    update public.artwork_variants set price_cents = null where id = var;
    r := r || E'\n[8] Remove the only price of a published work: FAIL (it was allowed)';
  exception when others then
    r := r || E'\n[8] Remove the only price of a published work blocked: PASS';
  end;
  begin
    update public.artworks set sale_mode = 'buy', edition_kind = 'limited' where id = art;
    delete from public.artwork_variants where id = var;
    r := r || E'\n[9] Delete the only variant of a published work: FAIL (it was allowed)';
  exception when others then
    r := r || E'\n[9] Delete the only variant of a published work blocked: PASS';
  end;

  -- ───── signed-in staff can actually read (the gap 0005 fixes) ─────
  begin
    insert into auth.users (id, email) values (staff, 'smoke-staff@example.invalid'), (stranger, 'smoke-stranger@example.invalid');
    insert into public.workspace_memberships (workspace_id, user_id, role) values (ws, staff, 'owner');

    perform set_config('request.jwt.claims', json_build_object('sub', staff, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', staff::text, true);
    set local role authenticated;
    select count(*) into seen_staff from public.artworks where workspace_id = ws;
    reset role;

    perform set_config('request.jwt.claims', json_build_object('sub', stranger, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', stranger::text, true);
    set local role authenticated;
    select count(*) into seen_stranger from public.artworks where workspace_id = ws;
    reset role;

    r := r || E'\n[10] Staff member reads artworks (expect 2): ' || seen_staff || case when seen_staff = 2 then '  PASS' else '  FAIL' end;
    r := r || E'\n[11] Signed-in non-member reads artworks (expect 0): ' || seen_stranger || case when seen_stranger = 0 then '  PASS' else '  FAIL' end;
  exception when others then
    reset role;
    r := r || E'\n[10-11] SKIPPED: could not create test users or switch role (' || sqlerrm || ')';
  end;

  raise exception E'SMOKE TEST 0004/0005 RESULTS (everything was rolled back):%', r;
end $$;
