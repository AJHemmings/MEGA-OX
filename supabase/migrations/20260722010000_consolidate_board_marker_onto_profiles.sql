-- Course correction from 20260722000000: discovered profiles already has
-- active_board_id/active_marker_id/active_theme_id from the very first
-- migration (20260316000000), FK'd to cosmetic_items, following the exact
-- same pattern as active_avatar_id/active_badge_id/active_banner_id (which
-- useLoadout.ts already reads/writes). Never wired into any UI or gameplay
-- code — same story as everything else here. This is the more consistent
-- home for board/marker equip state than user_equipped_skins (a separate
-- Phase-2 table built against a different, now-legacy 'skins' catalog).
--
-- Revert 20260722000000's FK repoint on user_equipped_skins (table has 0
-- rows — confirmed before this migration — so this is a clean, lossless
-- revert) and consolidate onto profiles instead:
--   - active_board_id: already correctly wired to cosmetic_items, untouched.
--   - active_marker_id: repurposed as the X-marker slot (no rename — same
--     column, new meaning, still NULL for every existing row).
--   - active_marker_o_id: new column, the O-marker slot.
-- Marker equip stays independent per role (Adam's call): two separate
-- columns, no locking X and O to the same owned item.

ALTER TABLE public.user_equipped_skins
  DROP CONSTRAINT user_equipped_skins_board_skin_id_fkey,
  DROP CONSTRAINT user_equipped_skins_marker_x_skin_id_fkey,
  DROP CONSTRAINT user_equipped_skins_marker_o_skin_id_fkey;

ALTER TABLE public.user_equipped_skins
  ADD CONSTRAINT user_equipped_skins_board_skin_id_fkey
    FOREIGN KEY (board_skin_id) REFERENCES public.skins(id),
  ADD CONSTRAINT user_equipped_skins_marker_x_skin_id_fkey
    FOREIGN KEY (marker_x_skin_id) REFERENCES public.skins(id),
  ADD CONSTRAINT user_equipped_skins_marker_o_skin_id_fkey
    FOREIGN KEY (marker_o_skin_id) REFERENCES public.skins(id);

ALTER TABLE public.profiles ADD COLUMN active_marker_o_id uuid;

ALTER TABLE public.profiles
  ADD CONSTRAINT fk_active_marker_o
    FOREIGN KEY (active_marker_o_id) REFERENCES public.cosmetic_items(id);
