-- 20260520000001_phase4_schema.sql
-- Phase 4: add avatar/badge/banner loadout columns to profiles,
-- seed placeholder cosmetic items, grant to all existing players.

-- 1. Add loadout columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_avatar_id uuid REFERENCES public.cosmetic_items(id),
  ADD COLUMN IF NOT EXISTS active_badge_id  uuid REFERENCES public.cosmetic_items(id),
  ADD COLUMN IF NOT EXISTS active_banner_id uuid REFERENCES public.cosmetic_items(id);

-- 2. Expand CHECK constraints to allow Phase 4 types/sources
-- (original constraints only allowed 'marker','board','theme' and 'shop','tournament','achievement')
ALTER TABLE public.cosmetic_items
  DROP CONSTRAINT IF EXISTS cosmetic_items_type_check,
  DROP CONSTRAINT IF EXISTS cosmetic_items_source_check;

ALTER TABLE public.cosmetic_items
  ADD CONSTRAINT cosmetic_items_type_check
    CHECK (type IN ('marker', 'board', 'theme', 'avatar', 'badge', 'banner', 'emoji')),
  ADD CONSTRAINT cosmetic_items_source_check
    CHECK (source IN ('shop', 'tournament', 'achievement', 'default'));

ALTER TABLE public.player_inventory
  DROP CONSTRAINT IF EXISTS player_inventory_acquisition_source_check;

ALTER TABLE public.player_inventory
  ADD CONSTRAINT player_inventory_acquisition_source_check
    CHECK (acquisition_source IN ('purchased', 'tournament', 'achievement', 'default'));

-- 3. Seed Phase 4 cosmetic items (all free, price = 0)
INSERT INTO public.cosmetic_items (id, name, type, asset_url, price, rarity, source, animated) VALUES
  ('00000000-0000-0004-0001-000000000001', 'Classic Blue',   'avatar',  'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><circle cx=%2220%22 cy=%2220%22 r=%2220%22 fill=%22%234299e1%22/><text x=%2220%22 y=%2226%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2214%22 font-family=%22sans-serif%22>OX</text></svg>', 0, 'common', 'default', false),
  ('00000000-0000-0004-0001-000000000002', 'Classic Orange', 'avatar',  'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><circle cx=%2220%22 cy=%2220%22 r=%2220%22 fill=%22%23ed8936%22/><text x=%2220%22 y=%2226%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2214%22 font-family=%22sans-serif%22>OX</text></svg>', 0, 'common', 'default', false),
  ('00000000-0000-0004-0002-000000000001', 'Newcomer',       'badge',   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22><polygon points=%2210,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7%22 fill=%22%23a0aec0%22/></svg>', 0, 'common', 'default', false),
  ('00000000-0000-0004-0002-000000000002', 'Player',         'badge',   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22><polygon points=%2210,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7%22 fill=%22%2348bb78%22/></svg>', 0, 'common', 'default', false),
  ('00000000-0000-0004-0003-000000000001', 'Night Sky',      'banner',  'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 60%22><defs><linearGradient id=%22g%22 x1=%220%22 x2=%221%22><stop offset=%220%22 stop-color=%22%231a2332%22/><stop offset=%221%22 stop-color=%22%232d3748%22/></linearGradient></defs><rect width=%22300%22 height=%2260%22 fill=%22url(%23g)%22/></svg>', 0, 'common', 'default', false),
  ('00000000-0000-0004-0003-000000000002', 'Ocean',          'banner',  'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 60%22><defs><linearGradient id=%22g%22 x1=%220%22 x2=%221%22><stop offset=%220%22 stop-color=%22%232b6cb0%22/><stop offset=%221%22 stop-color=%22%2300d4aa%22/></linearGradient></defs><rect width=%22300%22 height=%2260%22 fill=%22url(%23g)%22/></svg>', 0, 'common', 'default', false),
  ('00000000-0000-0004-0004-000000000001', 'Thumbs Up',      'emoji',   '👍', 0, 'common', 'default', false),
  ('00000000-0000-0004-0004-000000000002', 'Fire',           'emoji',   '🔥', 0, 'common', 'default', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Grant all Phase 4 items to every existing player
INSERT INTO public.player_inventory (player_id, item_id, acquisition_source)
SELECT p.id, i.id, 'default'
FROM public.profiles p
CROSS JOIN public.cosmetic_items i
WHERE i.source = 'default'
  AND i.type IN ('avatar', 'badge', 'banner', 'emoji')
ON CONFLICT DO NOTHING;

-- 5. Set default equipped items on all existing profiles
UPDATE public.profiles
SET
  active_avatar_id = COALESCE(active_avatar_id, '00000000-0000-0004-0001-000000000001'),
  active_badge_id  = COALESCE(active_badge_id,  '00000000-0000-0004-0002-000000000001'),
  active_banner_id = COALESCE(active_banner_id, '00000000-0000-0004-0003-000000000001')
WHERE active_avatar_id IS NULL
   OR active_badge_id  IS NULL
   OR active_banner_id IS NULL;

-- 6. RLS: allow users to update their own loadout columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;
