-- LGNDRY.Co Studio Desk — 0002 catalogue and media
-- DRAFT. Not applied to any database. Depends on 0001.
--
-- Purpose: make the storefront catalogue (today hard-coded in apps/storefront/src/lib/catalogue.ts)
-- and every image on the website editable from the Studio Desk.
--
-- Two kinds of dynamic image:
--   1. artwork images   -> public.artwork_images   (cover, gallery, detail, room view)
--   2. page images      -> public.media_slots       (e.g. 'home.hero', 'studio.portrait')
-- Print masters stay private. Only web derivatives are ever public.

create type public.release_status as enum ('draft', 'scheduled', 'published', 'retired');
create type public.sale_mode      as enum ('buy', 'enquire');            -- storefront: add to cart vs ask the studio
create type public.edition_kind   as enum ('open', 'limited');
create type public.asset_kind     as enum ('master', 'derivative');
create type public.asset_visibility as enum ('private', 'public');
create type public.image_role     as enum ('cover', 'gallery', 'detail', 'room_view');

-- ───────── storage objects ─────────
create table public.assets (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id),
  kind            public.asset_kind not null default 'master',
  master_asset_id uuid references public.assets(id) on delete cascade,
  bucket          text not null,
  object_key      text not null,
  mime_type       text not null,
  size_bytes      bigint not null check (size_bytes >= 0),
  width_px        integer check (width_px > 0),
  height_px       integer check (height_px > 0),
  checksum_sha256 text,
  visibility      public.asset_visibility not null default 'private',
  uploaded_by     uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  unique (bucket, object_key),
  -- a derivative points at its master; a master never does
  check ((kind = 'derivative') = (master_asset_id is not null)),
  -- print masters are never public
  check (kind <> 'master' or visibility = 'private')
);
create index assets_master on public.assets (master_asset_id);

-- ───────── collections ─────────
create table public.collections (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id),
  slug          text not null,
  title         text not null,
  kicker        text,
  intro         text,
  edition_label text,            -- e.g. "Limited run · Numbered"
  price_note    text,            -- display copy such as "By private enquiry"; real prices live on variants
  sort_order    integer not null default 0,
  published     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (workspace_id, slug)
);
create trigger collections_updated before update on public.collections for each row execute function app.set_updated_at();

-- ───────── artworks ─────────
create table public.artworks (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id),
  sku             text not null,
  slug            text not null,                       -- storefront URL segment
  title           text not null,
  collection_id   uuid references public.collections(id),
  category        text,                                -- Landscape, Documentary, Movement, Portraiture
  summary         text,
  story           text,
  sale_mode       public.sale_mode not null default 'enquire',
  edition_kind    public.edition_kind not null default 'open',
  availability_note text,
  tone            text,                                -- storefront placeholder tone while the image loads
  focal_x         numeric(5,2) check (focal_x between 0 and 100),
  focal_y         numeric(5,2) check (focal_y between 0 and 100),
  featured        boolean not null default false,
  show_remaining  boolean not null default false,      -- may the storefront show "N remaining"? off until the owner approves
  sort_order      integer not null default 0,
  release_status  public.release_status not null default 'draft',
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (workspace_id, sku),
  unique (workspace_id, slug),
  check (release_status <> 'published' or published_at is not null)
);
create index artworks_collection on public.artworks (collection_id, sort_order);
create trigger artworks_updated before update on public.artworks for each row execute function app.set_updated_at();

-- ───────── artwork images ─────────
create table public.artwork_images (
  id          uuid primary key default gen_random_uuid(),
  artwork_id  uuid not null references public.artworks(id) on delete cascade,
  asset_id    uuid not null references public.assets(id),   -- the master; web derivatives hang off it
  role        public.image_role not null default 'gallery',
  alt_text    text not null check (length(btrim(alt_text)) > 0),   -- alt text is required, not optional
  caption     text,
  focal_x     numeric(5,2) check (focal_x between 0 and 100),
  focal_y     numeric(5,2) check (focal_y between 0 and 100),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index artwork_images_artwork on public.artwork_images (artwork_id, sort_order);
-- exactly one cover per artwork
create unique index artwork_images_one_cover on public.artwork_images (artwork_id) where role = 'cover';

-- ───────── website page images ─────────
create table public.media_slots (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id),
  slot_key      text not null,                  -- 'home.hero', 'home.intro_1', 'studio.portrait', 'commission.hero'
  asset_id      uuid references public.assets(id),
  alt_text      text,
  focal_x       numeric(5,2) check (focal_x between 0 and 100),
  focal_y       numeric(5,2) check (focal_y between 0 and 100),
  updated_by    uuid references auth.users(id),
  updated_at    timestamptz not null default now(),
  unique (workspace_id, slot_key),
  check (asset_id is null or (alt_text is not null and length(btrim(alt_text)) > 0))
);
create trigger media_slots_updated before update on public.media_slots for each row execute function app.set_updated_at();

-- ───────── edition runs and variants ─────────
-- OPEN DECISION (docs/12 DEC-2026-008): do size/frame variants share one numbered run?
-- Default below = shared run, expressed explicitly through artwork_variants.edition_run_id.
create table public.edition_runs (
  id                  uuid primary key default gen_random_uuid(),
  artwork_id          uuid not null references public.artworks(id),
  run_code            text not null,
  title               text,
  max_copies          integer not null check (max_copies > 0),
  low_stock_threshold integer not null default 3 check (low_stock_threshold >= 0),
  release_at          timestamptz,
  retired_at          timestamptz,
  created_at          timestamptz not null default now(),
  unique (artwork_id, run_code)
);

create table public.artwork_variants (
  id             uuid primary key default gen_random_uuid(),
  artwork_id     uuid not null references public.artworks(id) on delete cascade,
  edition_run_id uuid references public.edition_runs(id),     -- null for open editions
  sku            text not null unique,
  size_label     text not null,                               -- A3, A2, A1, 'Set'
  width_mm       integer check (width_mm > 0),
  height_mm      integer check (height_mm > 0),
  frame_option   text not null default 'Unframed',
  price_cents    bigint check (price_cents >= 0),             -- null = price on request
  currency       text not null default 'ZAR' check (currency = 'ZAR'),
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (artwork_id, size_label, frame_option)
);
create trigger artwork_variants_updated before update on public.artwork_variants for each row execute function app.set_updated_at();

-- ───────── publish guard ─────────
-- An artwork cannot be published without a cover image, alt text, and (if it is for sale) a priced active variant.
create or replace function app.artworks_publish_guard() returns trigger
language plpgsql as $$
begin
  if new.release_status = 'published' then
    if not exists (select 1 from public.artwork_images i where i.artwork_id = new.id and i.role = 'cover') then
      raise exception 'Cannot publish "%": it has no cover image', new.title;
    end if;
    if new.sale_mode = 'buy' and not exists (
      select 1 from public.artwork_variants v where v.artwork_id = new.id and v.active and v.price_cents is not null
    ) then
      raise exception 'Cannot publish "%": buy mode needs at least one priced active variant', new.title;
    end if;
    if new.edition_kind = 'limited' and not exists (
      select 1 from public.artwork_variants v where v.artwork_id = new.id and v.edition_run_id is not null
    ) then
      raise exception 'Cannot publish "%": a limited edition needs an edition run on its variants', new.title;
    end if;
  end if;
  return new;
end $$;
create trigger artworks_publish_guard before insert or update of release_status on public.artworks
  for each row execute function app.artworks_publish_guard();

-- ───────── grants and RLS ─────────
alter table public.assets enable row level security;
alter table public.collections enable row level security;
alter table public.artworks enable row level security;
alter table public.artwork_images enable row level security;
alter table public.media_slots enable row level security;
alter table public.edition_runs enable row level security;
alter table public.artwork_variants enable row level security;

revoke all on public.assets, public.collections, public.artworks, public.artwork_images,
              public.media_slots, public.edition_runs, public.artwork_variants from anon, authenticated;
grant select, insert, update, delete on public.assets, public.collections, public.artworks, public.artwork_images,
              public.media_slots, public.edition_runs, public.artwork_variants to authenticated;

-- Catalogue editors: owner and studio manager. Read-only for finance, analyst and photographer.
do $$
declare t text;
begin
  foreach t in array array['assets','collections','artworks','artwork_images','media_slots','edition_runs','artwork_variants']
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (%s)',
      t || '_staff_read', t, case t
        when 'artwork_images'   then 'exists (select 1 from public.artworks a where a.id = artwork_id and app.has_role(a.workspace_id, array[''owner'',''studio_manager'',''finance'',''photographer'',''analyst'']::public.staff_role[]))'
        when 'edition_runs'     then 'exists (select 1 from public.artworks a where a.id = artwork_id and app.has_role(a.workspace_id, array[''owner'',''studio_manager'',''finance'',''photographer'',''analyst'']::public.staff_role[]))'
        when 'artwork_variants' then 'exists (select 1 from public.artworks a where a.id = artwork_id and app.has_role(a.workspace_id, array[''owner'',''studio_manager'',''finance'',''photographer'',''analyst'']::public.staff_role[]))'
        else 'app.has_role(workspace_id, array[''owner'',''studio_manager'',''finance'',''photographer'',''analyst'']::public.staff_role[])'
      end);
    execute format(
      'create policy %I on public.%I for all to authenticated using (%s) with check (%s)',
      t || '_editor_write', t,
      case t
        when 'artwork_images'   then 'exists (select 1 from public.artworks a where a.id = artwork_id and app.has_role(a.workspace_id, array[''owner'',''studio_manager'']::public.staff_role[]))'
        when 'edition_runs'     then 'exists (select 1 from public.artworks a where a.id = artwork_id and app.has_role(a.workspace_id, array[''owner'',''studio_manager'']::public.staff_role[]))'
        when 'artwork_variants' then 'exists (select 1 from public.artworks a where a.id = artwork_id and app.has_role(a.workspace_id, array[''owner'',''studio_manager'']::public.staff_role[]))'
        else 'app.has_role(workspace_id, array[''owner'',''studio_manager'']::public.staff_role[])'
      end,
      case t
        when 'artwork_images'   then 'exists (select 1 from public.artworks a where a.id = artwork_id and app.has_role(a.workspace_id, array[''owner'',''studio_manager'']::public.staff_role[]))'
        when 'edition_runs'     then 'exists (select 1 from public.artworks a where a.id = artwork_id and app.has_role(a.workspace_id, array[''owner'',''studio_manager'']::public.staff_role[]))'
        when 'artwork_variants' then 'exists (select 1 from public.artworks a where a.id = artwork_id and app.has_role(a.workspace_id, array[''owner'',''studio_manager'']::public.staff_role[]))'
        else 'app.has_role(workspace_id, array[''owner'',''studio_manager'']::public.staff_role[])'
      end);
  end loop;
end $$;

-- ───────── storage buckets (create in Supabase; policies in the dashboard or a later migration) ─────────
--   artwork-masters : PRIVATE. Print-resolution originals. Staff only, signed URLs.
--   artwork-public  : PUBLIC READ. Web derivatives only (WebP/AVIF at 800, 1600, 2400 px). Written by the server.
--   documents       : PRIVATE. Invoices, certificates, briefs.
