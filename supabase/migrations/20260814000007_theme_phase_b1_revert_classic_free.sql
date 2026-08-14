-- Revert 20260814000004: Classic goes back to being a purchasable shop theme.
-- Adam's call after seeing the effect in the shop — Classic disappearing from
-- the Theme tab was not wanted.
--
-- Restores the original values from 20260529000002_phase6_badge_source_themes:
-- price 250, source 'shop'.
--
-- The inventory grants from that migration's backfill are removed too, but
-- ONLY for the Classic theme row and ONLY where they came from the backfill
-- (acquisition_source = 'default'). This is a complete revert: before
-- 20260814000004 ran, zero players owned the Classic theme, so every such row
-- was created by it. Nothing a player actually bought is touched.
--
-- Classic's four COMPONENT items (background/cursor/sound_pack/pill_style,
-- seeded source='default' in 20260814000001) keep their grants. They are the
-- stock look every player already renders, they were never purchasable, and
-- handle_new_profile() grants them to new signups regardless.

UPDATE public.cosmetic_items
SET price = 250, source = 'shop'
WHERE id = '00000000-0000-0006-0006-000000000002'; -- Classic theme

DELETE FROM public.player_inventory
WHERE item_id = '00000000-0000-0006-0006-000000000002'
  AND acquisition_source = 'default';

-- KNOWN CONSEQUENCE, deliberately accepted: apply_theme requires ownership,
-- so with Classic purchasable again there is no free path back to the stock
-- look. Phase B2 must solve "reset to default" some other way — e.g. a
-- Customise-page reset that clears the four local slots to NULL (they already
-- degrade to Classic when NULL, per spec §5) rather than routing through
-- apply_theme. Do not re-grant Classic to fix this without asking.
