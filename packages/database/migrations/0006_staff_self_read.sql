-- LGNDRY.Co Studio Desk — 0006 let staff read their own membership
-- DRAFT. Not applied. Depends on 0001.
--
-- The studio asks, after sign-in, "does this person hold an active staff role?". That question reads the person's own
-- row in workspace_memberships. 0001 enabled row-level security on that table but granted nothing, so the check would
-- find nothing and every staff member would be shown "No access yet".
--
-- This grants the narrowest possible read: a signed-in user can see ONLY their own membership rows. They cannot see
-- anyone else's, and they cannot insert, update or delete any membership (role changes stay a server/owner action).

grant select on public.workspace_memberships to authenticated;

create policy memberships_self_read on public.workspace_memberships
  for select to authenticated
  using (user_id = auth.uid());
