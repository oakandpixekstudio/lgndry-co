-- LGNDRY.Co Studio Desk — 0004 storage buckets and policies
-- DRAFT. Not applied. Depends on 0001-0003. Run in the Supabase SQL Editor (the `storage` schema exists only on Supabase).
--
-- Three buckets (docs/06 section 12):
--   artwork-masters  PRIVATE       print-resolution originals. Staff only.
--   artwork-public   PUBLIC READ   web-sized copies only. Written by the server, never by a browser.
--   documents        PRIVATE       invoices, certificates, briefs. Staff read; written by the server.
--
-- Path convention for every object: {workspace_id}/{...}. Policies read the workspace from the first path segment.
-- Size limits and file types below are engineering defaults, not business decisions; change them freely.

-- ───────── buckets (idempotent) ─────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('artwork-masters', 'artwork-masters', false, 262144000,
     array['image/tiff', 'image/jpeg', 'image/png']),
  ('artwork-public',  'artwork-public',  true,  15728640,
     array['image/webp', 'image/avif', 'image/jpeg']),
  ('documents',       'documents',       false, 26214400,
     array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ───────── helper: workspace id from an object path ─────────
create or replace function app.storage_workspace(object_name text) returns uuid
language sql immutable as $$
  select case
    when split_part(object_name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(object_name, '/', 1)::uuid
  end
$$;
grant execute on function app.storage_workspace(text) to authenticated;

-- ───────── policies on storage.objects ─────────
-- Default stays "no access". Each policy below opens one narrow door.

-- artwork-masters: owner and studio manager can read, upload, replace and delete originals.
create policy masters_staff_read on storage.objects for select to authenticated
  using (bucket_id = 'artwork-masters'
         and app.has_role(app.storage_workspace(name), array['owner','studio_manager','photographer']::public.staff_role[]));
create policy masters_editor_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'artwork-masters'
              and app.has_role(app.storage_workspace(name), array['owner','studio_manager']::public.staff_role[]));
create policy masters_editor_update on storage.objects for update to authenticated
  using (bucket_id = 'artwork-masters'
         and app.has_role(app.storage_workspace(name), array['owner','studio_manager']::public.staff_role[]))
  with check (bucket_id = 'artwork-masters'
              and app.has_role(app.storage_workspace(name), array['owner','studio_manager']::public.staff_role[]));
create policy masters_editor_delete on storage.objects for delete to authenticated
  using (bucket_id = 'artwork-masters'
         and app.has_role(app.storage_workspace(name), array['owner','studio_manager']::public.staff_role[]));

-- artwork-public: anyone can download an object by its URL (the bucket is public).
-- Staff can list. NOTHING grants authenticated or anon the right to write here: only the server (service role)
-- creates web copies, after generating them from a private master.
create policy public_art_staff_list on storage.objects for select to authenticated
  using (bucket_id = 'artwork-public'
         and app.has_role(app.storage_workspace(name), array['owner','studio_manager','finance','photographer','analyst']::public.staff_role[]));

-- documents: owner, studio manager and finance can read. Only the server writes.
create policy documents_staff_read on storage.objects for select to authenticated
  using (bucket_id = 'documents'
         and app.has_role(app.storage_workspace(name), array['owner','studio_manager','finance']::public.staff_role[]));
