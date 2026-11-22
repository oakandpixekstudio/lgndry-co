-- LGNDRY.Co Studio Desk — 0011 photography bookings (the pipeline, with no money in it yet)
-- DRAFT. Not applied. Depends on 0001 and 0003.
--
-- One row per booking request. A request is NOT a calendar commitment (docs/01: BKG-01); staff move it along the
-- pipeline by hand. Deliberately NOT here yet, because they depend on decisions the client has not made (docs/17 D5):
-- service packages and prices, quotes, deposit rules, invoices, and resource/double-booking checks. The two payment
-- statuses (quoted, awaiting_deposit) exist so the pipeline matches the plan, but the screen does not offer them yet.
-- Nothing here marks anything paid.
--
-- service_type is free text on purpose: the list of services is the studio's to define, not ours to invent.

create type public.booking_status as enum (
  'requested', 'review', 'quoted', 'awaiting_deposit', 'confirmed', 'scheduled',
  'in_progress', 'editing', 'delivered', 'completed', 'cancelled', 'expired'
);

create sequence public.booking_ref_seq;

create table public.booking_requests (
  id                 uuid primary key default gen_random_uuid(),
  workspace_id       uuid not null references public.workspaces(id),
  booking_ref        text not null default ('BK-' || to_char(now() at time zone 'Africa/Johannesburg', 'YYYY') || '-' || lpad(nextval('public.booking_ref_seq')::text, 4, '0')),
  customer_id        uuid not null references public.customers(id),
  enquiry_id         uuid references public.enquiries(id),
  title              text not null check (length(btrim(title)) between 1 and 200),
  service_type       text check (service_type is null or length(service_type) <= 80),
  status             public.booking_status not null default 'requested',
  location_text      text check (location_text is null or length(location_text) <= 300),
  brief              text check (brief is null or length(brief) <= 5000),
  budget_note        text check (budget_note is null or length(budget_note) <= 200),   -- the customer's own words, not a quote
  internal_notes     text check (internal_notes is null or length(internal_notes) <= 5000),
  preferred_start_at timestamptz,
  preferred_end_at   timestamptz,
  assignee_id        uuid references auth.users(id),
  confirmed_at       timestamptz,
  completed_at       timestamptz,
  cancelled_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (workspace_id, booking_ref),
  check (preferred_end_at is null or preferred_start_at is null or preferred_end_at >= preferred_start_at)
);
create index booking_requests_status on public.booking_requests (workspace_id, status, preferred_start_at);
create index booking_requests_customer on public.booking_requests (customer_id);

create trigger booking_requests_updated before update on public.booking_requests for each row execute function app.set_updated_at();

-- Stamps the milestone times so staff cannot forget them and the history stays honest.
create function app.booking_milestones() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    if new.status = 'confirmed' and new.confirmed_at is null then new.confirmed_at = now(); end if;
    if new.status = 'completed' then new.completed_at = coalesce(new.completed_at, now()); end if;
    if new.status in ('cancelled', 'expired') then new.cancelled_at = coalesce(new.cancelled_at, now()); end if;
  end if;
  return new;
end $$;
create trigger booking_requests_milestones before insert or update of status on public.booking_requests
  for each row execute function app.booking_milestones();

alter table public.booking_requests enable row level security;
revoke all on public.booking_requests from anon, authenticated;
grant select, insert, update on public.booking_requests to authenticated;   -- no delete: a booking is cancelled, never removed
grant usage on sequence public.booking_ref_seq to authenticated;

create policy bookings_staff_read on public.booking_requests for select to authenticated
  using (app.has_role(workspace_id, array['owner','studio_manager','finance']::public.staff_role[])
         or (assignee_id = auth.uid() and app.has_role(workspace_id, array['photographer']::public.staff_role[])));  -- a photographer sees only their own shoots
create policy bookings_editor_insert on public.booking_requests for insert to authenticated
  with check (app.has_role(workspace_id, array['owner','studio_manager']::public.staff_role[]));
create policy bookings_editor_update on public.booking_requests for update to authenticated
  using (app.has_role(workspace_id, array['owner','studio_manager']::public.staff_role[]))
  with check (app.has_role(workspace_id, array['owner','studio_manager']::public.staff_role[]));
