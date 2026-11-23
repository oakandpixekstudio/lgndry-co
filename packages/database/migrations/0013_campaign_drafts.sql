-- LGNDRY.Co Studio Desk — 0013 newsletter and campaign drafts (drafts only: nothing here can be sent)
-- DRAFT. Not applied. Depends on 0001.
--
-- docs/01 CMP-02: the first release may save internal drafts only, and must never expose a working Send action without a
-- configured email provider and authorisation. So the status column can only say 'draft' or 'archived': the database
-- itself refuses 'sent' or 'scheduled'. Sending arrives later with its own migration, once an email service is connected,
-- the privacy notice is approved and every message carries an unsubscribe link (docs/17 C2 and C3).
--
-- The audience is a rule, not a saved list of people: the screen counts who currently holds marketing consent, so a
-- person who unsubscribes drops out on their own.

create table public.campaigns (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id),
  name          text not null check (length(btrim(name)) between 1 and 120),
  subject       text check (subject is null or length(subject) <= 200),
  preview_text  text check (preview_text is null or length(preview_text) <= 200),
  body          text not null default '' check (length(body) <= 20000),
  audience      text not null default 'all_subscribers' check (audience in ('all_subscribers', 'subscribed_enquirers')),
  status        text not null default 'draft' check (status in ('draft', 'archived')),
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index campaigns_workspace on public.campaigns (workspace_id, status, updated_at desc);
create trigger campaigns_updated before update on public.campaigns for each row execute function app.set_updated_at();

alter table public.campaigns enable row level security;
revoke all on public.campaigns from anon, authenticated;
grant select, insert, update on public.campaigns to authenticated;   -- no delete: a draft is archived, never removed

create policy campaigns_staff_read on public.campaigns for select to authenticated
  using (app.has_role(workspace_id, array['owner','studio_manager']::public.staff_role[]));
create policy campaigns_staff_insert on public.campaigns for insert to authenticated
  with check (app.has_role(workspace_id, array['owner','studio_manager']::public.staff_role[]) and created_by = auth.uid());
create policy campaigns_staff_update on public.campaigns for update to authenticated
  using (app.has_role(workspace_id, array['owner','studio_manager']::public.staff_role[]))
  with check (app.has_role(workspace_id, array['owner','studio_manager']::public.staff_role[]));
