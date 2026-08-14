-- Theme Phase B1: make themes real items (spec §4).
-- Adds the four theme-component cosmetic types, their four equip slots on
-- profiles, and the config JSONB column that carries every component's
-- payload (palette, gradient layers, oscillator params, pill variants).
--
-- Board and marker slots are deliberately untouched: profiles.active_board_id
-- / active_marker_id / active_marker_o_id are already the real equip home as
-- of 20260722010000_consolidate_board_marker_onto_profiles.sql.

-- 1. Widen the two closed CHECK lists (both originally set in
--    20260520000001_phase4_schema.sql). Same DROP/ADD pattern as that file.
ALTER TABLE public.cosmetic_items
  DROP CONSTRAINT IF EXISTS cosmetic_items_type_check;

ALTER TABLE public.cosmetic_items
  ADD CONSTRAINT cosmetic_items_type_check
    CHECK (type IN ('marker', 'board', 'theme', 'avatar', 'badge', 'banner',
                    'emoji', 'background', 'cursor', 'sound_pack', 'pill_style'));

ALTER TABLE public.player_inventory
  DROP CONSTRAINT IF EXISTS player_inventory_acquisition_source_check;

ALTER TABLE public.player_inventory
  ADD CONSTRAINT player_inventory_acquisition_source_check
    CHECK (acquisition_source IN ('purchased', 'tournament', 'achievement',
                                  'default', 'theme_bundle'));

-- 2. The four new equip slots.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_background_id uuid,
  ADD COLUMN IF NOT EXISTS active_cursor_id     uuid,
  ADD COLUMN IF NOT EXISTS active_sound_pack_id uuid,
  ADD COLUMN IF NOT EXISTS active_pill_style_id uuid;

ALTER TABLE public.profiles
  ADD CONSTRAINT fk_active_background
    FOREIGN KEY (active_background_id) REFERENCES public.cosmetic_items(id),
  ADD CONSTRAINT fk_active_cursor
    FOREIGN KEY (active_cursor_id)     REFERENCES public.cosmetic_items(id),
  ADD CONSTRAINT fk_active_sound_pack
    FOREIGN KEY (active_sound_pack_id) REFERENCES public.cosmetic_items(id),
  ADD CONSTRAINT fk_active_pill_style
    FOREIGN KEY (active_pill_style_id) REFERENCES public.cosmetic_items(id);

-- 3. One nullable payload column, discriminated by cosmetic_items.type (§4).
--    Assets live on the component items; a theme row's config only NAMES its
--    members. NULL is legal and means "no payload" — the client degrades to
--    Classic per surface (§5 degradation rules).
ALTER TABLE public.cosmetic_items
  ADD COLUMN IF NOT EXISTS config JSONB;

COMMENT ON COLUMN public.cosmetic_items.config IS
  'Type-discriminated payload. theme: {members:{slot:uuid}}. background: '
  '{palette,base,layers}. sound_pack: {event:[{freq,dur,wave,gain,delay}]}. '
  'pill_style: {variant:{bg,border,color}}. cursor: {svg,hotspot}. See spec §4.';
