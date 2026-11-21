-- LGNDRY.Co Studio Desk — 0009 website enquiries and newsletter sign-ups
-- DRAFT. Not applied. Depends on 0001-0003.
--
-- How a visitor's form reaches the Studio Desk:
--   website form -> the website's SERVER route (checks the form, hides a trap field for bots)
--                -> one of the two functions below, called with the server-side service key
--                -> a customer, an enquiry (or a newsletter consent) in the database.
--
-- Why a function and not an open table: the public key can be copied by anyone, so no browser may write to the CRM
-- tables (docs/04). These functions can be run ONLY by the service role, i.e. only by the website's own server.
-- They also check every field and refuse floods, so a bot that somehow reached them still cannot fill the inbox.
--
-- Not decided yet (docs/17 C3): the privacy notice. Newsletter consent is recorded with no policy version until
-- that notice is approved, and there is no unsubscribe link yet. Do not send marketing email until both exist.

-- ───────── extra fields the forms collect ─────────
alter table public.enquiries
  add column if not exists phone text,
  add column if not exists organisation text,
  add column if not exists topic text,                       -- what the visitor said it is about, e.g. "Photoshoot"
  add column if not exists details jsonb not null default '{}'::jsonb,   -- other answers, e.g. {"timeline": "Within 1-2 months"}
  add column if not exists intake_ip_hash text;               -- a one-way hash used only to refuse floods; never the address itself
alter table public.consents add column if not exists intake_ip_hash text;

create index if not exists enquiries_intake_recent on public.enquiries (received_at desc);
create sequence if not exists public.enquiry_ref_seq;

-- ───────── helpers ─────────
create or replace function app.is_email(value text) returns boolean
language sql immutable as $$
  select value ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' and length(value) <= 254
$$;

-- find or create the customer for an email address; never overwrites what staff have already written
create or replace function app.intake_customer(ws uuid, email text, full_name text, organisation text, source text) returns uuid
language plpgsql as $$
declare cust uuid;
begin
  select id into cust from public.customers
   where workspace_id = ws and primary_email_normalized = email and archived_at is null;
  if cust is null then
    insert into public.customers (workspace_id, customer_type, display_name, company, primary_email_normalized, source)
    values (ws, case when coalesce(organisation, '') <> '' then 'company' else 'individual' end,
            coalesce(nullif(full_name, ''), split_part(email, '@', 1)), nullif(organisation, ''), email, source)
    returning id into cust;
  elsif full_name <> '' then
    -- a newsletter sign-up only knew the email; give it the real name once we have one
    update public.customers set display_name = full_name where id = cust and display_name = split_part(email, '@', 1);
  end if;
  return cust;
end $$;

-- ───────── enquiry ─────────
-- p: name, email, message, category (availability | general | commission | photography), phone, organisation,
--    topic, details (object), artwork_slug, ip_hash
-- Returns the enquiry reference, e.g. ENQ-2026-0001.
create or replace function public.intake_enquiry(p jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare
  ws uuid;
  full_name text := btrim(coalesce(p->>'name', ''));
  email text := lower(btrim(coalesce(p->>'email', '')));
  msg text := btrim(coalesce(p->>'message', ''));
  cat public.enquiry_category;
  ip text := nullif(p->>'ip_hash', '');
  cust uuid;
  art uuid;
  ref text;
begin
  select id into ws from public.workspaces where slug = 'lgndry';
  if ws is null then
    raise exception 'not_configured';
  end if;

  if full_name = '' or length(full_name) > 120 then raise exception 'invalid_input:name'; end if;
  if not app.is_email(email) then raise exception 'invalid_input:email'; end if;
  if msg = '' or length(msg) > 5000 then raise exception 'invalid_input:message'; end if;
  if length(coalesce(p->>'phone', '')) > 40 or length(coalesce(p->>'organisation', '')) > 120 or length(coalesce(p->>'topic', '')) > 120 then
    raise exception 'invalid_input:field';
  end if;
  if length(coalesce(p->'details', '{}'::jsonb)::text) > 2000 then raise exception 'invalid_input:details'; end if;

  -- refuse floods: per address, per visitor (hashed), and overall
  if (select count(*) from public.enquiries where contact_email = email and received_at > now() - interval '1 hour') >= 5 then raise exception 'rate_limited'; end if;
  if ip is not null and (select count(*) from public.enquiries where intake_ip_hash = ip and received_at > now() - interval '1 hour') >= 10 then raise exception 'rate_limited'; end if;
  if (select count(*) from public.enquiries where received_at > now() - interval '1 hour') >= 300 then raise exception 'rate_limited'; end if;

  cat := case when p->>'category' in ('availability', 'general', 'commission', 'photography') then (p->>'category')::public.enquiry_category else 'general' end;
  cust := app.intake_customer(ws, email, full_name, p->>'organisation', 'storefront');
  select id into art from public.artworks where workspace_id = ws and slug = nullif(p->>'artwork_slug', '') limit 1;

  ref := 'ENQ-' || to_char(now() at time zone 'Africa/Johannesburg', 'YYYY') || '-' || lpad(nextval('public.enquiry_ref_seq')::text, 4, '0');
  insert into public.enquiries (workspace_id, enquiry_ref, customer_id, contact_name, contact_email, category, source, artwork_id,
                                message, phone, organisation, topic, details, intake_ip_hash)
  values (ws, ref, cust, full_name, email, cat, 'website', art, msg, nullif(btrim(coalesce(p->>'phone', '')), ''),
          nullif(btrim(coalesce(p->>'organisation', '')), ''), nullif(btrim(coalesce(p->>'topic', '')), ''),
          case when jsonb_typeof(p->'details') = 'object' then p->'details' else '{}'::jsonb end, ip);

  insert into public.audit_events (workspace_id, service_actor, entity_type, action, reason)
  values (ws, 'website', 'enquiry', 'received', ref);
  return ref;
end $$;

-- ───────── newsletter ─────────
-- p: email, ip_hash. Creates the customer if needed and records marketing consent once.
create or replace function public.intake_newsletter(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  ws uuid;
  email text := lower(btrim(coalesce(p->>'email', '')));
  ip text := nullif(p->>'ip_hash', '');
  cust uuid;
begin
  select id into ws from public.workspaces where slug = 'lgndry';
  if ws is null then raise exception 'not_configured'; end if;
  if not app.is_email(email) then raise exception 'invalid_input:email'; end if;

  if ip is not null and (select count(*) from public.consents where intake_ip_hash = ip and recorded_at > now() - interval '1 hour') >= 10 then raise exception 'rate_limited'; end if;
  if (select count(*) from public.consents where purpose = 'marketing_email' and recorded_at > now() - interval '1 hour') >= 300 then raise exception 'rate_limited'; end if;

  cust := app.intake_customer(ws, email, '', null, 'newsletter');
  if not exists (select 1 from public.consents where customer_id = cust and purpose = 'marketing_email' and granted and revoked_at is null) then
    insert into public.consents (customer_id, purpose, channel, granted, proof_source, intake_ip_hash)
    values (cust, 'marketing_email', 'email', true, 'storefront newsletter form', ip);
  end if;
end $$;

-- ───────── only the website's server may run them ─────────
revoke all on function public.intake_enquiry(jsonb) from public, anon, authenticated;
revoke all on function public.intake_newsletter(jsonb) from public, anon, authenticated;
grant execute on function public.intake_enquiry(jsonb) to service_role;
grant execute on function public.intake_newsletter(jsonb) to service_role;
