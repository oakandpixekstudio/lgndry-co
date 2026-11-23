-- LGNDRY.Co Studio Desk — 0012 a written record of what was said to and by each customer
-- DRAFT. Not applied. Depends on 0003 and 0011.
--
-- The Inbox shows one conversation per customer: the messages they sent through the website forms (those live in
-- `enquiries`) plus anything staff record here: an email they sent or received in their own mailbox, a phone or WhatsApp
-- call, or an internal note. Nothing is sent from this table. When an email service is connected (docs/17 C2), sent mail
-- will be written here too, as direction 'out' and channel 'email'.
--
-- It is a record, so it is append-only: no one can edit or delete a line once written. A wrong entry is corrected by
-- adding another. (Same idea as the audit log.)

create table public.customer_messages (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id),
  customer_id   uuid not null references public.customers(id),
  enquiry_id    uuid references public.enquiries(id),
  booking_id    uuid references public.booking_requests(id),
  direction     text not null check (direction in ('in', 'out', 'note')),   -- from them, to them, or internal only
  channel       text not null check (channel in ('email', 'phone', 'whatsapp', 'in_person', 'other')),
  subject       text check (subject is null or length(subject) <= 200),
  body          text not null check (length(btrim(body)) between 1 and 10000),
  created_by    uuid references auth.users(id),
  occurred_at   timestamptz not null default now(),    -- when it happened (can be earlier than when it was recorded)
  created_at    timestamptz not null default now()
);
create index customer_messages_customer on public.customer_messages (customer_id, occurred_at desc);
create index customer_messages_workspace on public.customer_messages (workspace_id, occurred_at desc);

alter table public.customer_messages enable row level security;
revoke all on public.customer_messages from anon, authenticated;
grant select, insert on public.customer_messages to authenticated;   -- no update, no delete

create policy customer_messages_staff_read on public.customer_messages for select to authenticated
  using (app.has_role(workspace_id, array['owner','studio_manager']::public.staff_role[]));

-- A line is always recorded as the person writing it, in the same workspace as the customer it is about.
create policy customer_messages_staff_insert on public.customer_messages for insert to authenticated
  with check (
    app.has_role(workspace_id, array['owner','studio_manager']::public.staff_role[])
    and created_by = auth.uid()
    and exists (select 1 from public.customers c where c.id = customer_id and c.workspace_id = customer_messages.workspace_id)
    -- a line may only point at an enquiry or booking of the same workspace
    and (enquiry_id is null or exists (select 1 from public.enquiries e where e.id = enquiry_id and e.workspace_id = customer_messages.workspace_id))
    and (booking_id is null or exists (select 1 from public.booking_requests b where b.id = booking_id and b.workspace_id = customer_messages.workspace_id))
  );
