-- LGNDRY.Co Studio Desk — 0003 customers, orders, enquiries and the storefront read layer
-- DRAFT. Not applied to any database. Depends on 0001 and 0002.
--
-- Not included on purpose (blocked on open questions in docs/12 §3):
--   payments, payment sessions and webhooks (payment provider not chosen)
--   invoices and tax (VAT status and legal entity not confirmed)
--   shipping rates (areas, couriers and rates not supplied)
-- They arrive in a later migration. Until then orders cannot become 'paid' through any public path.

-- ───────── customers ─────────
create table public.customers (
  id                     uuid primary key default gen_random_uuid(),
  workspace_id           uuid not null references public.workspaces(id),
  auth_user_id           uuid unique references auth.users(id),   -- set only if the customer opts into an account
  customer_type          text not null default 'individual' check (customer_type in ('individual','company')),
  display_name           text not null,
  first_name             text,
  last_name              text,
  company                text,
  primary_email_normalized text,
  phone_e164             text,
  segment                text,
  owner_user_id          uuid references auth.users(id),
  source                 text,                                     -- 'storefront', 'enquiry', 'manual', 'import'
  notes                  text,
  created_at             timestamptz not null default now(),
  archived_at            timestamptz
);
create unique index customers_email_unique on public.customers (workspace_id, primary_email_normalized)
  where primary_email_normalized is not null and archived_at is null;

create table public.customer_addresses (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  kind        text not null check (kind in ('billing','delivery')),
  line1       text not null,
  line2       text,
  city        text not null,
  region      text,
  postal_code text,
  country     text not null default 'ZA',
  is_default  boolean not null default false
);

-- Marketing permission is separate from the legal basis for transactional mail (docs/06 §4).
create table public.consents (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid not null references public.customers(id) on delete cascade,
  purpose        text not null check (purpose in ('marketing_email','order_updates','analytics')),
  channel        text not null default 'email',
  granted        boolean not null,
  proof_source   text not null,          -- e.g. 'storefront newsletter form', IP and timestamp live in proof metadata
  policy_version text,                   -- set once the privacy notice is approved
  recorded_at    timestamptz not null default now(),
  revoked_at     timestamptz
);
create index consents_customer on public.consents (customer_id, purpose, recorded_at desc);

-- ───────── enquiries (website forms land here) ─────────
create type public.enquiry_category as enum ('availability', 'general', 'commission', 'photography');
create type public.enquiry_status   as enum ('new', 'in_progress', 'qualified', 'converted', 'closed');

create table public.enquiries (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id),
  enquiry_ref   text not null,
  customer_id   uuid references public.customers(id),
  contact_name  text not null,
  contact_email text not null,
  category      public.enquiry_category not null,
  source        text not null default 'website',
  status        public.enquiry_status not null default 'new',
  artwork_id    uuid references public.artworks(id),   -- "Enquire about this work"
  message       text not null check (length(message) <= 5000),
  assignee_id   uuid references auth.users(id),
  received_at   timestamptz not null default now(),
  resolved_at   timestamptz,
  unique (workspace_id, enquiry_ref)
);
create index enquiries_status on public.enquiries (workspace_id, status, received_at desc);

-- ───────── orders ─────────
create type public.order_status as enum (
  'draft', 'awaiting_payment', 'paid', 'in_production', 'ready_to_ship', 'shipped', 'completed', 'cancelled', 'refunded'
);

create table public.orders (
  id                   uuid primary key default gen_random_uuid(),
  workspace_id         uuid not null references public.workspaces(id),
  order_ref            text not null,
  customer_id          uuid not null references public.customers(id),
  origin               text not null default 'storefront' check (origin in ('storefront','manual','invoice')),
  status               public.order_status not null default 'awaiting_payment',
  currency             text not null default 'ZAR' check (currency = 'ZAR'),
  subtotal_cents       bigint not null check (subtotal_cents >= 0),
  delivery_cents       bigint not null default 0 check (delivery_cents >= 0),
  tax_cents            bigint not null default 0 check (tax_cents >= 0),
  discount_cents       bigint not null default 0 check (discount_cents >= 0),
  total_cents          bigint not null check (total_cents >= 0),
  billing_snapshot_json  jsonb,
  delivery_snapshot_json jsonb,
  placed_at            timestamptz not null default now(),
  paid_at              timestamptz,                  -- written only by the server after a VERIFIED payment event
  cancelled_at         timestamptz,
  version              integer not null default 1,
  unique (workspace_id, order_ref),
  check (total_cents = subtotal_cents + delivery_cents + tax_cents - discount_cents),
  check ((status in ('paid','in_production','ready_to_ship','shipped','completed','refunded')) = (paid_at is not null)
         or status in ('cancelled','refunded'))
);
create index orders_status_date on public.orders (workspace_id, status, placed_at desc);
create index orders_customer on public.orders (customer_id);

create table public.order_items (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.orders(id) on delete cascade,
  artwork_variant_id  uuid not null references public.artwork_variants(id),
  edition_run_id      uuid references public.edition_runs(id),
  quantity            integer not null check (quantity > 0),
  unit_price_cents    bigint not null check (unit_price_cents >= 0),     -- snapshot, immutable after submission
  tax_cents           bigint not null default 0 check (tax_cents >= 0),
  line_total_cents    bigint not null check (line_total_cents >= 0),
  title_snapshot      text not null,
  variant_snapshot_json jsonb not null,
  check (line_total_cents = unit_price_cents * quantity + tax_cents)
);
create index order_items_order on public.order_items (order_id);

create table public.order_state_events (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  from_state public.order_status,
  to_state   public.order_status not null,
  actor_id   uuid references auth.users(id),
  source     text not null,
  reason     text,
  created_at timestamptz not null default now()
);

-- A retried "place order" request must not create a second order.
create table public.idempotency_keys (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references public.workspaces(id),
  scope            text not null,
  key_hash         text not null,
  request_hash     text not null,
  result_entity_id uuid,
  expires_at       timestamptz not null,
  unique (workspace_id, scope, key_hash)
);

-- ───────── edition reservations and numbers ─────────
create type public.reservation_state as enum ('active', 'converted', 'expired', 'released');

create table public.edition_reservations (
  id             uuid primary key default gen_random_uuid(),
  edition_run_id uuid not null references public.edition_runs(id),
  order_item_id  uuid not null references public.order_items(id) on delete cascade,
  quantity       integer not null check (quantity > 0),
  state          public.reservation_state not null default 'active',
  expires_at     timestamptz not null,                  -- policy value is an open decision (A-004 proposes 72h)
  released_at    timestamptz,
  created_at     timestamptz not null default now()
);
create index edition_reservations_run on public.edition_reservations (edition_run_id, state);

create table public.edition_numbers (
  id              uuid primary key default gen_random_uuid(),
  edition_run_id  uuid not null references public.edition_runs(id),
  number          integer not null check (number > 0),
  order_item_id   uuid references public.order_items(id),
  allocated_at    timestamptz,
  coa_asset_id    uuid references public.assets(id),
  released_by_refund_at timestamptz,
  unique (edition_run_id, number)
);
create unique index edition_numbers_one_per_item on public.edition_numbers (order_item_id) where order_item_id is not null and released_by_refund_at is null;

-- RULE (CLAUDE.md): never allocate an edition number before verified payment.
create or replace function app.edition_number_requires_payment() returns trigger
language plpgsql as $$
declare paid timestamptz; max_n integer;
begin
  if new.order_item_id is not null and new.released_by_refund_at is null then
    select o.paid_at into paid
      from public.order_items i join public.orders o on o.id = i.order_id
     where i.id = new.order_item_id;
    if paid is null then
      raise exception 'Edition number % cannot be allocated: the order is not verified as paid', new.number;
    end if;
    select max_copies into max_n from public.edition_runs where id = new.edition_run_id;
    if new.number > max_n then
      raise exception 'Edition number % exceeds the run size of %', new.number, max_n;
    end if;
    new.allocated_at = coalesce(new.allocated_at, now());
  end if;
  return new;
end $$;
create trigger edition_numbers_payment_guard before insert or update on public.edition_numbers
  for each row execute function app.edition_number_requires_payment();

-- Copies still available = run size - allocated numbers - active holds. Counts every variant on the run.
create or replace function app.edition_remaining(run uuid) returns integer
language sql stable as $$
  select r.max_copies
         - (select count(*) from public.edition_numbers n where n.edition_run_id = r.id and n.order_item_id is not null and n.released_by_refund_at is null)::integer
         - coalesce((select sum(quantity) from public.edition_reservations e where e.edition_run_id = r.id and e.state = 'active' and e.expires_at > now()), 0)::integer
    from public.edition_runs r where r.id = run
$$;

-- ───────── storefront read layer ─────────
-- The website reads ONLY these views, with the anon key. Nothing here exposes customers, orders or private assets.
create view public.storefront_collections with (security_barrier = true) as
  select c.slug, c.title, c.kicker, c.intro, c.edition_label, c.price_note, c.sort_order
    from public.collections c where c.published;

create view public.storefront_artworks with (security_barrier = true) as
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
   where a.release_status = 'published' and a.published_at <= now();

create view public.storefront_artwork_images with (security_barrier = true) as
  select i.artwork_id, i.role, i.alt_text, i.caption, i.focal_x, i.focal_y, i.sort_order,
         d.bucket, d.object_key, d.width_px, d.height_px
    from public.artwork_images i
    join public.storefront_artworks a on a.id = i.artwork_id
    join public.assets d on d.master_asset_id = i.asset_id and d.kind = 'derivative' and d.visibility = 'public';

create view public.storefront_variants with (security_barrier = true) as
  select v.artwork_id, v.sku, v.size_label, v.width_mm, v.height_mm, v.frame_option, v.price_cents, v.currency
    from public.artwork_variants v
    join public.storefront_artworks a on a.id = v.artwork_id
   where v.active;

create view public.storefront_media_slots with (security_barrier = true) as
  select s.slot_key, s.alt_text, s.focal_x, s.focal_y, d.bucket, d.object_key, d.width_px, d.height_px
    from public.media_slots s
    join public.assets d on d.master_asset_id = s.asset_id and d.kind = 'derivative' and d.visibility = 'public';

grant select on public.storefront_collections, public.storefront_artworks, public.storefront_artwork_images,
                public.storefront_variants, public.storefront_media_slots to anon, authenticated;

-- ───────── grants and RLS ─────────
alter table public.customers enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.consents enable row level security;
alter table public.enquiries enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_state_events enable row level security;
alter table public.idempotency_keys enable row level security;
alter table public.edition_reservations enable row level security;
alter table public.edition_numbers enable row level security;

revoke all on public.customers, public.customer_addresses, public.consents, public.enquiries, public.orders,
              public.order_items, public.order_state_events, public.idempotency_keys,
              public.edition_reservations, public.edition_numbers from anon, authenticated;
-- anon has no access to any of these. Public order and enquiry intake runs through server routes using the service role,
-- which validate input, recompute prices from artwork_variants, rate-limit, and write with an idempotency key.

grant select on public.customers, public.customer_addresses, public.consents, public.enquiries, public.orders,
                public.order_items, public.order_state_events, public.edition_reservations, public.edition_numbers to authenticated;
grant update on public.customers, public.enquiries to authenticated;

-- Staff: Photographers and Analysts must not read contact data (docs/06 §4).
create policy customers_staff_read on public.customers for select to authenticated
  using (app.has_role(workspace_id, array['owner','studio_manager','finance']::public.staff_role[]));
create policy customers_staff_update on public.customers for update to authenticated
  using (app.has_role(workspace_id, array['owner','studio_manager']::public.staff_role[]))
  with check (app.has_role(workspace_id, array['owner','studio_manager']::public.staff_role[]));
create policy enquiries_staff_read on public.enquiries for select to authenticated
  using (app.has_role(workspace_id, array['owner','studio_manager','finance']::public.staff_role[]));
create policy enquiries_staff_update on public.enquiries for update to authenticated
  using (app.has_role(workspace_id, array['owner','studio_manager']::public.staff_role[]))
  with check (app.has_role(workspace_id, array['owner','studio_manager']::public.staff_role[]));
create policy orders_staff_read on public.orders for select to authenticated
  using (app.has_role(workspace_id, array['owner','studio_manager','finance']::public.staff_role[]));
create policy order_items_staff_read on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
                 and app.has_role(o.workspace_id, array['owner','studio_manager','finance']::public.staff_role[])));
create policy order_events_staff_read on public.order_state_events for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
                 and app.has_role(o.workspace_id, array['owner','studio_manager','finance']::public.staff_role[])));
create policy addresses_staff_read on public.customer_addresses for select to authenticated
  using (exists (select 1 from public.customers c where c.id = customer_id
                 and app.has_role(c.workspace_id, array['owner','studio_manager','finance']::public.staff_role[])));
create policy consents_staff_read on public.consents for select to authenticated
  using (exists (select 1 from public.customers c where c.id = customer_id
                 and app.has_role(c.workspace_id, array['owner','studio_manager']::public.staff_role[])));
create policy reservations_staff_read on public.edition_reservations for select to authenticated
  using (exists (select 1 from public.edition_runs r join public.artworks a on a.id = r.artwork_id
                  where r.id = edition_run_id
                    and app.has_role(a.workspace_id, array['owner','studio_manager','finance']::public.staff_role[])));
create policy edition_numbers_staff_read on public.edition_numbers for select to authenticated
  using (exists (select 1 from public.edition_runs r join public.artworks a on a.id = r.artwork_id
                  where r.id = edition_run_id
                    and app.has_role(a.workspace_id, array['owner','studio_manager','finance']::public.staff_role[])));

-- Customers with an optional account (passwordless) see only their own orders. This is the whole "My orders" surface.
create policy customers_own_read on public.customers for select to authenticated using (auth_user_id = auth.uid());
create policy orders_own_read on public.orders for select to authenticated
  using (exists (select 1 from public.customers c where c.id = customer_id and c.auth_user_id = auth.uid()));
create policy order_items_own_read on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o join public.customers c on c.id = o.customer_id
                  where o.id = order_id and c.auth_user_id = auth.uid()));
