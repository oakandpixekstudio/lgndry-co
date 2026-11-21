-- LGNDRY.Co Studio Desk — the four collections.
-- Run ONCE in the Supabase SQL Editor, after migrations 0001-0007 and seeds/first_owner.sql.
--
-- The Catalogue screens list these in the "Collection" drop-down. The wording is the storefront prototype's copy
-- (apps/storefront/src/lib/catalogue.ts) so the two read the same. Editing it later is a normal catalogue change.
--
-- Deliberately NOT set:
--   price_note: the storefront's "From R 2,500" style figures are unapproved prototype numbers (docs/12 section 7).
--   published:  stays false, so nothing about a collection reaches the website until the owner publishes it.
--
-- Safe to run twice: it will not create duplicates or overwrite edits.

insert into public.collections (workspace_id, slug, title, kicker, intro, edition_label, sort_order, published)
select w.id, c.slug, c.title, c.kicker, c.intro, c.edition_label, c.sort_order, false
  from public.workspaces w
  cross join (values
    ('open-editions', 'Open Editions', 'The accessible way in',
     'Photographs printed to order and never capped. The simplest way to live with an LGNDRY image, in the size and finish that suits your wall.',
     'Open edition · Made to order', 10),
    ('individual-works', 'Individual Works', 'Considered, one at a time',
     'Standalone photographs, each released in a small, deliberate run. Numbered, certified and finished by hand.',
     'Limited run · Numbered', 20),
    ('photographic-series', 'Photographic Series', 'A body of work, together',
     'Connected sequences of images collected as a complete set. Built to be hung as one conversation across a wall.',
     'Complete sets', 30),
    ('collectors-editions', 'Collector''s Editions', 'Five works. Strictly limited.',
     'Our rarest releases. Each of the five is capped at a handful of copies, individually numbered and presented to museum standard with a signed certificate.',
     'Strictly limited · Numbered', 40)
  ) as c (slug, title, kicker, intro, edition_label, sort_order)
 where w.slug = 'lgndry'
on conflict (workspace_id, slug) do nothing;

select slug, title, published from public.collections order by sort_order;
