-- LGNDRY.Co Studio Desk — 0005 publish-guard hardening and schema grants
-- DRAFT. Not applied. Depends on 0001-0004.
--
-- Fixes two gaps found while building the catalogue screens:
--   1. The publish guard in 0002 only ran when release_status changed, so deleting the cover image or the last
--      priced variant of an already-published work was not caught by the database.
--   2. Signed-in users had EXECUTE on app.has_role() but no USAGE on the `app` schema, so every staff RLS policy
--      would have failed with "permission denied for schema app" the first time a staff member read a table.
--      The smoke test did not catch it because it only exercised the anonymous role.

-- ───────── 2. schema access ─────────
grant usage on schema app to authenticated;

-- ───────── 1. publish guard, reusable and applied to every table that can break a published work ─────────
create or replace function app.assert_publishable(target uuid) returns void
language plpgsql stable as $$
declare art public.artworks;
begin
  select * into art from public.artworks where id = target;
  if not found or art.release_status <> 'published' then
    return;                                   -- only published works are protected
  end if;
  if not exists (select 1 from public.artwork_images i where i.artwork_id = art.id and i.role = 'cover') then
    raise exception 'Published work "%" must keep a cover image', art.title using errcode = 'check_violation';
  end if;
  if art.sale_mode = 'buy' and not exists (
    select 1 from public.artwork_variants v where v.artwork_id = art.id and v.active and v.price_cents is not null
  ) then
    raise exception 'Published work "%" in buy mode must keep a priced active variant', art.title using errcode = 'check_violation';
  end if;
  if art.edition_kind = 'limited' and not exists (
    select 1 from public.artwork_variants v where v.artwork_id = art.id and v.edition_run_id is not null
  ) then
    raise exception 'Published limited edition "%" must keep a variant linked to an edition run', art.title using errcode = 'check_violation';
  end if;
end $$;

-- 0002's trigger becomes a thin wrapper and also fires when sale mode or edition kind change.
-- It must be an AFTER trigger: assert_publishable() reads the table, and a BEFORE trigger would still see the OLD row
-- (so draft -> published would be checked against "draft" and pass).
create or replace function app.artworks_publish_guard() returns trigger
language plpgsql as $$
begin
  if new.release_status = 'published' then
    perform app.assert_publishable(new.id);
  end if;
  return null;
end $$;

drop trigger if exists artworks_publish_guard on public.artworks;
create trigger artworks_publish_guard after insert or update of release_status, sale_mode, edition_kind on public.artworks
  for each row execute function app.artworks_publish_guard();

-- Children: checked at the end of the transaction, so a cover image can be swapped for another in one go.
create or replace function app.child_publish_guard() returns trigger
language plpgsql as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform app.assert_publishable(old.artwork_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    perform app.assert_publishable(new.artwork_id);
  end if;
  return null;
end $$;

drop trigger if exists artwork_images_publish_guard on public.artwork_images;
create constraint trigger artwork_images_publish_guard after update or delete on public.artwork_images
  deferrable initially deferred for each row execute function app.child_publish_guard();

drop trigger if exists artwork_variants_publish_guard on public.artwork_variants;
create constraint trigger artwork_variants_publish_guard after update or delete on public.artwork_variants
  deferrable initially deferred for each row execute function app.child_publish_guard();
