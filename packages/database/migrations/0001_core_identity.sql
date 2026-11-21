-- LGNDRY.Co Studio Desk — 0001 core identity
-- DRAFT. Not applied to any database. Review, then run through Supabase migrations.
-- Conventions (docs/06_DATA_MODEL.md §1): uuid keys, timestamptz in UTC, money as integer cents, explicit RLS.

create schema if not exists app;

-- ───────── helpers ─────────
create or replace function app.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ───────── workspaces and staff ─────────
create table public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  -- legal_name and tax_config_json stay null until the owner supplies verified details (docs/12 §3).
  legal_name  text,
  currency    text not null default 'ZAR' check (currency = 'ZAR'),
  timezone    text not null default 'Africa/Johannesburg',
  tax_config_json jsonb,
  created_at  timestamptz not null default now()
);

create type public.staff_role as enum ('owner', 'studio_manager', 'finance', 'photographer', 'analyst');

create table public.workspace_memberships (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         public.staff_role not null,
  active       boolean not null default true,
  invited_by   uuid references auth.users(id),
  joined_at    timestamptz not null default now(),
  unique (workspace_id, user_id, role)
);
create index workspace_memberships_user on public.workspace_memberships (user_id) where active;

-- True when the signed-in user holds an active staff role in the workspace.
-- security definer so policies can call it without granting read access to memberships.
create or replace function app.has_role(ws uuid, allowed public.staff_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_memberships m
    where m.workspace_id = ws and m.user_id = auth.uid() and m.active and m.role = any (allowed)
  )
$$;
revoke all on function app.has_role(uuid, public.staff_role[]) from public;
grant execute on function app.has_role(uuid, public.staff_role[]) to authenticated;

-- ───────── audit ─────────
create table public.audit_events (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references public.workspaces(id),
  actor_user_id  uuid references auth.users(id),
  service_actor  text,
  entity_type    text not null,
  entity_id      uuid,
  action         text not null,
  before_redacted jsonb,
  after_redacted  jsonb,
  reason         text,
  request_id     text,
  created_at     timestamptz not null default now(),
  check (actor_user_id is not null or service_actor is not null)
);
create index audit_events_entity on public.audit_events (workspace_id, entity_type, entity_id, created_at desc);

-- Append-only: block update and delete for everyone, including the service role.
create or replace function app.audit_append_only() returns trigger
language plpgsql as $$
begin
  raise exception 'audit_events is append-only';
end $$;
create trigger audit_events_no_change before update or delete on public.audit_events
  for each row execute function app.audit_append_only();

-- ───────── grants and RLS ─────────
alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.audit_events enable row level security;

revoke all on public.workspaces, public.workspace_memberships, public.audit_events from anon, authenticated;
grant select on public.workspaces to authenticated;
grant select on public.audit_events to authenticated;

create policy workspaces_staff_read on public.workspaces for select to authenticated
  using (app.has_role(id, array['owner','studio_manager','finance','photographer','analyst']::public.staff_role[]));

create policy audit_read_privileged on public.audit_events for select to authenticated
  using (app.has_role(workspace_id, array['owner','finance']::public.staff_role[]));
-- Inserts into audit_events happen only through the server (service role) or security-definer functions.
