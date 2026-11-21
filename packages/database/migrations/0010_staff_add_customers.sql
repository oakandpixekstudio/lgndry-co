-- LGNDRY.Co Studio Desk — 0010 let the owner and studio managers add customers by hand
-- DRAFT. Not applied. Depends on 0003.
--
-- Customers normally arrive on their own (a website enquiry or newsletter sign-up creates one). The Customers screen
-- also needs "Add customer" for people who phone, email or walk in. 0003 gave staff read and update only, so this adds
-- insert, for the same two roles that can already change customers. Deleting stays impossible: a customer is archived,
-- never removed (docs/06: orders and invoices must keep pointing at someone).

grant insert on public.customers to authenticated;

create policy customers_editor_insert on public.customers for insert to authenticated
  with check (app.has_role(workspace_id, array['owner','studio_manager']::public.staff_role[]));
