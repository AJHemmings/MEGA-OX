-- Fix: grant default cosmetic items to new players on signup and backfill existing accounts
-- Root cause: handle_new_profile() trigger never included the player_inventory grant added in
-- Phase 4 (20260520000001). Any account created after that migration ran has an empty inventory.

-- 1. Patch the trigger to grant default items + set equipped defaults on every new signup
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.player_stats (player_id) VALUES (new.id);
  INSERT INTO public.currency_balance (player_id) VALUES (new.id);
  INSERT INTO public.login_streaks (player_id) VALUES (new.id);

  INSERT INTO public.player_inventory (player_id, item_id, acquisition_source)
  SELECT new.id, id, 'default'
  FROM public.cosmetic_items
  WHERE source = 'default'
  ON CONFLICT DO NOTHING;

  UPDATE public.profiles
  SET
    active_avatar_id = COALESCE(active_avatar_id, '00000000-0000-0004-0001-000000000001'),
    active_badge_id  = COALESCE(active_badge_id,  '00000000-0000-0004-0002-000000000001'),
    active_banner_id = COALESCE(active_banner_id, '00000000-0000-0004-0003-000000000001')
  WHERE id = new.id;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Backfill: grant default items to any existing player who is missing them
INSERT INTO public.player_inventory (player_id, item_id, acquisition_source)
SELECT p.id, i.id, 'default'
FROM public.profiles p
CROSS JOIN public.cosmetic_items i
WHERE i.source = 'default'
ON CONFLICT DO NOTHING;

-- 3. Backfill: set default equipped items on any profile that is missing them
UPDATE public.profiles
SET
  active_avatar_id = COALESCE(active_avatar_id, '00000000-0000-0004-0001-000000000001'),
  active_badge_id  = COALESCE(active_badge_id,  '00000000-0000-0004-0002-000000000001'),
  active_banner_id = COALESCE(active_banner_id, '00000000-0000-0004-0003-000000000001')
WHERE active_avatar_id IS NULL
   OR active_badge_id  IS NULL
   OR active_banner_id IS NULL;
