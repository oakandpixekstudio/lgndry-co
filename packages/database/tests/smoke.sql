-- LGNDRY.Co Studio Desk: smoke test for migrations 0001-0003.
-- Run in the Supabase SQL Editor AFTER applying the migrations.
--
-- Safe to run: the whole script is one DO block that always ends by raising an exception. That rolls back
-- every row it created, so nothing is saved. The exception text IS the report. Expect a red error box that
-- starts with "SMOKE TEST RESULTS"; that is normal.

do $$
declare
  r text := '';
  ws uuid; art uuid; run uuid; var uuid; cust uuid; ord uuid; item uuid;
begin
  -- 1. every public table has RLS switched on
  r := r || E'\n[1] Tables without RLS: ' || coalesce((
    select string_agg(c.relname, ', ') from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity), 'none  (PASS)');

  -- 2. anon can only see the storefront views
  r := r || E'\n[2] anon grants outside storefront_* views: ' || coalesce((
    select string_agg(distinct table_name, ', ') from information_schema.role_table_grants
     where grantee = 'anon' and table_schema = 'public' and table_name not like 'storefront\_%'), 'none  (PASS)');

  -- set up a tiny fixture
  insert into public.workspaces (slug, name) values ('smoke-test', 'Smoke Test') returning id into ws;
  insert into public.customers (workspace_id, display_name, primary_email_normalized) values (ws, 'Test Customer', 'test@example.com') returning id into cust;

  -- 3. cannot publish a work with no cover image
  begin
    insert into public.artworks (workspace_id, sku, slug, title, release_status, published_at)
      values (ws, 'S-PUB', 's-pub', 'No cover', 'published', now());
    r := r || E'\n[3] Publish without cover: FAIL (it was allowed)';
  exception when others then
    r := r || E'\n[3] Publish without cover blocked: PASS  (' || sqlerrm || ')';
  end;

  -- 4. a print master cannot be public
  begin
    insert into public.assets (workspace_id, kind, bucket, object_key, mime_type, size_bytes, visibility)
      values (ws, 'master', 'artwork-masters', 'smoke/master.tif', 'image/tiff', 10, 'public');
    r := r || E'\n[4] Public master: FAIL (it was allowed)';
  exception when others then
    r := r || E'\n[4] Public master blocked: PASS';
  end;

  -- 5. edition number cannot be allocated before verified payment
  insert into public.artworks (workspace_id, sku, slug, title, edition_kind) values (ws, 'S-LTD', 's-ltd', 'Limited', 'limited') returning id into art;
  insert into public.edition_runs (artwork_id, run_code, max_copies) values (art, 'R1', 5) returning id into run;
  insert into public.artwork_variants (artwork_id, edition_run_id, sku, size_label, price_cents) values (art, run, 'S-LTD-A3', 'A3', 250000) returning id into var;
  insert into public.orders (workspace_id, order_ref, customer_id, status, subtotal_cents, total_cents)
    values (ws, 'SMOKE-1', cust, 'awaiting_payment', 250000, 250000) returning id into ord;
  insert into public.order_items (order_id, artwork_variant_id, edition_run_id, quantity, unit_price_cents, line_total_cents, title_snapshot, variant_snapshot_json)
    values (ord, var, run, 1, 250000, 250000, 'Limited', '{}'::jsonb) returning id into item;

  begin
    insert into public.edition_numbers (edition_run_id, number, order_item_id) values (run, 1, item);
    r := r || E'\n[5] Number before payment: FAIL (it was allowed)';
  exception when others then
    r := r || E'\n[5] Number before payment blocked: PASS  (' || sqlerrm || ')';
  end;

  -- 6. after verified payment, allocation works; beyond the run size it does not
  update public.orders set status = 'paid', paid_at = now() where id = ord;
  begin
    insert into public.edition_numbers (edition_run_id, number, order_item_id) values (run, 1, item);
    r := r || E'\n[6a] Number after payment: PASS';
  exception when others then
    r := r || E'\n[6a] Number after payment: FAIL (' || sqlerrm || ')';
  end;
  begin
    insert into public.edition_numbers (edition_run_id, number, order_item_id) values (run, 9, item);
    r := r || E'\n[6b] Number beyond run size: FAIL (it was allowed)';
  exception when others then
    r := r || E'\n[6b] Number beyond run size blocked: PASS';
  end;
  r := r || E'\n[6c] Copies remaining (expect 4): ' || app.edition_remaining(run);

  -- 7. order totals must add up
  begin
    insert into public.orders (workspace_id, order_ref, customer_id, subtotal_cents, total_cents)
      values (ws, 'SMOKE-BAD', cust, 100, 999);
    r := r || E'\n[7] Bad order total: FAIL (it was allowed)';
  exception when others then
    r := r || E'\n[7] Bad order total blocked: PASS';
  end;

  -- 8. anonymous visitors cannot read customers or orders
  begin
    set local role anon;
    perform 1 from public.customers limit 1;
    reset role;
    r := r || E'\n[8] anon read customers: FAIL (it was allowed)';
  exception when others then
    reset role;
    r := r || E'\n[8] anon read customers blocked: PASS';
  end;

  -- 9. anonymous visitors can read the storefront views (and see no unpublished work)
  begin
    set local role anon;
    perform 1 from public.storefront_artworks limit 1;
    reset role;
    r := r || E'\n[9] anon read storefront_artworks: PASS';
  exception when others then
    reset role;
    r := r || E'\n[9] anon read storefront_artworks: FAIL (' || sqlerrm || ')';
  end;

  raise exception E'SMOKE TEST RESULTS (everything was rolled back):%', r;
end $$;
