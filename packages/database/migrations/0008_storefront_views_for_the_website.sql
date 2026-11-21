-- LGNDRY.Co Studio Desk — 0008 what the public website reads
-- DRAFT. Not applied. Depends on 0003 and 0007.
--
-- The website (apps/storefront) reads ONLY the storefront_* views, with the public anon key. Two small changes make
-- those views enough to build the whole shop:
--   1. storefront_artwork_images gains `image_id`, so a picture that has several web-sized copies (800, 1600 and 2400 px)
--      can be grouped back into one picture.
--   2. storefront_collections shows a collection once it has at least one live work, so nobody has to remember to
--      "publish" a collection (there is no screen for that) before its works can appear.
--
-- Nothing private is added: the views still expose no customers, orders, private files or unpublished works.

-- 1. `create or replace view` may only ADD columns at the end, which is what this does.
create or replace view public.storefront_artwork_images with (security_barrier = true) as
  select i.artwork_id, i.role, i.alt_text, i.caption, i.focal_x, i.focal_y, i.sort_order,
         d.bucket, d.object_key, d.width_px, d.height_px,
         i.id as image_id
    from public.artwork_images i
    join public.storefront_artworks a on a.id = i.artwork_id
    join public.assets d on d.master_asset_id = i.asset_id and d.kind = 'derivative' and d.visibility = 'public';

-- 2. same columns as 0003; only the filter changes
create or replace view public.storefront_collections with (security_barrier = true) as
  select c.slug, c.title, c.kicker, c.intro, c.edition_label, c.price_note, c.sort_order
    from public.collections c
   where c.published
      or exists (select 1 from public.storefront_artworks a where a.collection_slug = c.slug);

grant select on public.storefront_artwork_images, public.storefront_collections to anon, authenticated;
