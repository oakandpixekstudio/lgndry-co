-- LGNDRY.Co Studio Desk — 0007 catalogue save/delete functions, scheduled works, alt text on drafts
-- DRAFT. Not applied. Depends on 0001-0006.
--
-- What the Catalogue screens need from the database:
--   1. ONE atomic call to save a work with its images, sizes and edition run (a half-saved work is worse than an error).
--   2. A safe way to delete a draft.
--   3. Scheduled works go live by themselves when their time arrives.
--   4. Drafts can hold an image whose alt text is still empty (the publish guard requires it before going live).
--
-- Both functions run as the CALLER (security invoker), so row-level security still decides who may change what.

-- ───────── 4. alt text may be empty on drafts; the publish guard enforces it ─────────
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'public.artwork_images'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%alt_text%'
  loop
    execute format('alter table public.artwork_images drop constraint %I', c.conname);
  end loop;
end $$;

-- ───────── 3. the guard protects scheduled works too, and requires alt text ─────────
create or replace function app.assert_publishable(target uuid) returns void
language plpgsql stable as $$
declare art public.artworks;
begin
  select * into art from public.artworks where id = target;
  if not found or art.release_status not in ('published', 'scheduled') then
    return;                                   -- drafts and retired works are not protected
  end if;
  if not exists (select 1 from public.artwork_images i where i.artwork_id = art.id and i.role = 'cover') then
    raise exception 'Work "%" must keep a cover image', art.title using errcode = 'check_violation';
  end if;
  if exists (select 1 from public.artwork_images i where i.artwork_id = art.id and length(btrim(i.alt_text)) = 0) then
    raise exception 'Work "%" has an image without alt text', art.title using errcode = 'check_violation';
  end if;
  if art.sale_mode = 'buy' and not exists (
    select 1 from public.artwork_variants v where v.artwork_id = art.id and v.active and v.price_cents is not null
  ) then
    raise exception 'Work "%" in buy mode must keep a priced active size', art.title using errcode = 'check_violation';
  end if;
  if art.edition_kind = 'limited' and not exists (
    select 1 from public.artwork_variants v where v.artwork_id = art.id and v.edition_run_id is not null
  ) then
    raise exception 'Limited edition "%" must keep a size linked to an edition run', art.title using errcode = 'check_violation';
  end if;
end $$;

create or replace function app.artworks_publish_guard() returns trigger
language plpgsql as $$
begin
  if new.release_status in ('published', 'scheduled') then
    if new.published_at is null then
      raise exception 'Work "%" needs a go-live date', new.title using errcode = 'check_violation';
    end if;
    perform app.assert_publishable(new.id);
  end if;
  return null;
end $$;

-- A scheduled work is live once its date has passed. (Same columns as 0003, so the view can be replaced in place.)
create or replace view public.storefront_artworks with (security_barrier = true) as
  select a.id, a.slug, a.title, c.slug as collection_slug, a.category, a.summary, a.story, a.sale_mode,
         a.edition_kind, a.availability_note, a.tone, a.focal_x, a.focal_y, a.featured, a.sort_order, a.published_at,
         case when a.show_remaining and a.edition_kind = 'limited'
              then (select min(app.edition_remaining(v.edition_run_id)) from public.artwork_variants v
                     where v.artwork_id = a.id and v.edition_run_id is not null)
         end as copies_remaining,
         (select r.max_copies from public.edition_runs r join public.artwork_variants v on v.edition_run_id = r.id
           where v.artwork_id = a.id limit 1) as edition_size
    from public.artworks a
    left join public.collections c on c.id = a.collection_id
   where a.release_status in ('published', 'scheduled') and a.published_at <= now();

-- ───────── 1. save a work, atomically ─────────
-- Payload keys: id, sku, slug, title, collection_slug, category, summary, story, sale_mode, edition_kind,
--   availability_note, featured, show_remaining, release_status, published_at,
--   edition_run {run_code, max_copies, low_stock_threshold} | null,
--   variants [{id, sku, size_label, frame_option, price_cents, active}],
--   images   [{id, asset_id, role, alt_text, focal_x, focal_y, sort_order}]
create or replace function public.save_artwork(p_workspace uuid, p jsonb) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  art_id uuid := coalesce(nullif(p->>'id', '')::uuid, gen_random_uuid());
  coll uuid;
  existing public.release_status;
  target public.release_status := coalesce(nullif(p->>'release_status', '')::public.release_status, 'draft');
  kind public.edition_kind := coalesce(nullif(p->>'edition_kind', '')::public.edition_kind, 'open');
  run_id uuid;
  v jsonb;
  i jsonb;
  keep_ids uuid[];
begin
  select id into coll from public.collections where workspace_id = p_workspace and slug = nullif(p->>'collection_slug', '');
  select release_status into existing from public.artworks where id = art_id and workspace_id = p_workspace;

  -- Work as a draft while the pieces are written, then apply the real status LAST, so the publish guard
  -- sees a complete work (and a half-saved one can never go live).
  if existing is not null then
    update public.artworks set release_status = 'draft' where id = art_id;
  end if;

  insert into public.artworks (id, workspace_id, sku, slug, title, collection_id, category, summary, story, sale_mode,
                               edition_kind, availability_note, featured, show_remaining, release_status)
  values (art_id, p_workspace, p->>'sku', p->>'slug', p->>'title', coll, nullif(p->>'category', ''), p->>'summary', p->>'story',
          coalesce(nullif(p->>'sale_mode', '')::public.sale_mode, 'enquire'), kind, p->>'availability_note',
          coalesce((p->>'featured')::boolean, false), coalesce((p->>'show_remaining')::boolean, false), 'draft')
  on conflict (id) do update set
    sku = excluded.sku, slug = excluded.slug, title = excluded.title, collection_id = excluded.collection_id,
    category = excluded.category, summary = excluded.summary, story = excluded.story, sale_mode = excluded.sale_mode,
    edition_kind = excluded.edition_kind, availability_note = excluded.availability_note, featured = excluded.featured,
    show_remaining = excluded.show_remaining, release_status = 'draft', published_at = null;

  -- edition run: one active run per work
  if kind = 'limited' and jsonb_typeof(p->'edition_run') = 'object' and coalesce((p#>>'{edition_run,max_copies}')::int, 0) > 0 then
    select id into run_id from public.edition_runs where artwork_id = art_id and retired_at is null limit 1;
    if run_id is null then
      insert into public.edition_runs (artwork_id, run_code, max_copies, low_stock_threshold)
      values (art_id, coalesce(nullif(p#>>'{edition_run,run_code}', ''), 'R1'), (p#>>'{edition_run,max_copies}')::int,
              coalesce((p#>>'{edition_run,low_stock_threshold}')::int, 3))
      returning id into run_id;
    else
      update public.edition_runs
         set run_code = coalesce(nullif(p#>>'{edition_run,run_code}', ''), run_code),
             max_copies = (p#>>'{edition_run,max_copies}')::int,
             low_stock_threshold = coalesce((p#>>'{edition_run,low_stock_threshold}')::int, low_stock_threshold)
       where id = run_id;
    end if;
  else
    run_id := null;
    -- an open edition has no run: retire it rather than delete it (it may already have numbers or reservations).
    -- A limited edition whose copy count is still blank keeps whatever run it has; the publish guard demands one later.
    if kind = 'open' then
      update public.edition_runs set retired_at = now() where artwork_id = art_id and retired_at is null;
    end if;
  end if;

  -- sizes: remove the ones that were taken out, then upsert the rest
  select coalesce(array_agg((x->>'id')::uuid), '{}') into keep_ids from jsonb_array_elements(coalesce(p->'variants', '[]'::jsonb)) x;
  delete from public.artwork_variants where artwork_id = art_id and id <> all (keep_ids);
  for v in select * from jsonb_array_elements(coalesce(p->'variants', '[]'::jsonb)) loop
    insert into public.artwork_variants (id, artwork_id, edition_run_id, sku, size_label, frame_option, price_cents, active)
    values ((v->>'id')::uuid, art_id, run_id, v->>'sku', coalesce(v->>'size_label', ''), coalesce(nullif(v->>'frame_option', ''), 'Unframed'),
            (v->>'price_cents')::bigint, coalesce((v->>'active')::boolean, true))
    on conflict (id) do update set
      edition_run_id = excluded.edition_run_id, sku = excluded.sku, size_label = excluded.size_label,
      frame_option = excluded.frame_option, price_cents = excluded.price_cents, active = excluded.active;
  end loop;

  -- images: free the cover slot first so a new cover can take it, then upsert in order
  select coalesce(array_agg((x->>'id')::uuid), '{}') into keep_ids from jsonb_array_elements(coalesce(p->'images', '[]'::jsonb)) x;
  delete from public.artwork_images where artwork_id = art_id and id <> all (keep_ids);
  update public.artwork_images set role = 'gallery' where artwork_id = art_id and role = 'cover';
  for i in select * from jsonb_array_elements(coalesce(p->'images', '[]'::jsonb)) loop
    insert into public.artwork_images (id, artwork_id, asset_id, role, alt_text, focal_x, focal_y, sort_order)
    values ((i->>'id')::uuid, art_id, (i->>'asset_id')::uuid, coalesce(nullif(i->>'role', '')::public.image_role, 'gallery'),
            coalesce(i->>'alt_text', ''), (i->>'focal_x')::numeric, (i->>'focal_y')::numeric, coalesce((i->>'sort_order')::int, 0))
    on conflict (id) do update set
      asset_id = excluded.asset_id, role = excluded.role, alt_text = excluded.alt_text,
      focal_x = excluded.focal_x, focal_y = excluded.focal_y, sort_order = excluded.sort_order;
  end loop;

  -- the real status, last
  update public.artworks
     set release_status = target, published_at = nullif(p->>'published_at', '')::timestamptz
   where id = art_id;

  return art_id;
end $$;

-- ───────── 2. delete a draft ─────────
create or replace function public.delete_draft_artwork(p_id uuid) returns void
language plpgsql security invoker set search_path = public as $$
declare status public.release_status;
begin
  select release_status into status from public.artworks where id = p_id;
  if not found then
    return;
  end if;
  if status <> 'draft' then
    raise exception 'Only a draft can be deleted. Retire a published work instead.' using errcode = 'check_violation';
  end if;
  delete from public.edition_runs where artwork_id = p_id;   -- images and sizes go with the work (cascade)
  delete from public.artworks where id = p_id;
end $$;

grant execute on function public.save_artwork(uuid, jsonb) to authenticated;
grant execute on function public.delete_draft_artwork(uuid) to authenticated;
revoke execute on function public.save_artwork(uuid, jsonb) from anon, public;
revoke execute on function public.delete_draft_artwork(uuid) from anon, public;
