-- Theme Phase B1: Classic is the default look, not a purchase.
--
-- apply_theme requires ownership, and spec §5 makes re-applying a theme the
-- reset-to-default mechanism. With Classic priced 250/source='shop', a player
-- who switched to Ember could not return to the stock look without paying —
-- for a theme whose four components are all free 'default' items anyway.
--
-- No trigger change is needed: handle_new_profile() (see
-- 20260615000004_fix_default_items_on_signup.sql) already grants every
-- source='default' item on signup. Only existing players need backfilling.

-- 1. Classic becomes a default item rather than a shop item.
UPDATE public.cosmetic_items
SET price = 0, source = 'default'
WHERE id = '00000000-0000-0006-0006-000000000002'; -- Classic theme

-- 2. Backfill every existing player with all default items they don't own.
--    Same CROSS JOIN pattern as 20260615000004. Picks up the Classic theme
--    and Classic's four components (seeded source='default' in
--    20260814000001) in one pass.
INSERT INTO public.player_inventory (player_id, item_id, acquisition_source)
SELECT p.id, i.id, 'default'
FROM public.profiles p
CROSS JOIN public.cosmetic_items i
WHERE i.source = 'default'
ON CONFLICT DO NOTHING;
