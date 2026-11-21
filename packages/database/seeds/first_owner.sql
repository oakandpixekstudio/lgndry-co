-- LGNDRY.Co Studio Desk — create the first workspace and its first Owner.
-- Run ONCE in the Supabase SQL Editor, after migrations 0001-0006.
--
-- Step 1: create the person in Supabase: Authentication > Users > "Add user" (email + a strong password, tick
--         "Auto Confirm User"), or "Invite user" to send them an email. Do NOT type a password into this file.
-- Step 2: change the ONE line marked "EDIT THIS LINE" below to that same email address, then run this script.
--         (Do not use find-and-replace across the whole file; only that one line needs to change.)
--
-- Safe to run twice: it will not create duplicates.

do $$
declare
  owner_email text := 'type-the-owner-email-here';   -- EDIT THIS LINE
  uid uuid;
  ws  uuid;
begin
  -- must look like a real email address, so the placeholder can never be used by accident
  if owner_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Set owner_email (the line marked EDIT THIS LINE) to the owner''s real email address first.';
  end if;

  select id into uid from auth.users where lower(email) = lower(owner_email);
  if uid is null then
    raise exception 'No user with the email "%". Create the user under Authentication > Users first.', owner_email;
  end if;

  -- legal_name and tax_config_json stay empty until the owner supplies verified details (docs/12).
  insert into public.workspaces (slug, name) values ('lgndry', 'LGNDRY.Co') on conflict (slug) do nothing;
  select id into ws from public.workspaces where slug = 'lgndry';

  insert into public.workspace_memberships (workspace_id, user_id, role)
    values (ws, uid, 'owner')
    on conflict (workspace_id, user_id, role) do nothing;

  insert into public.audit_events (workspace_id, service_actor, entity_type, entity_id, action, reason)
    values (ws, 'seed:first_owner', 'workspace_membership', uid, 'grant_owner', 'First owner created from the setup script');

  raise notice 'Done. % is now an Owner of workspace % (%).', owner_email, 'lgndry', ws;
end $$;
