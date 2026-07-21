-- Board & marker skins: the shop already sells these (cosmetic_items type
-- 'board'/'marker', player_inventory ownership) but nothing ever let a player
-- equip them or rendered them in a game. Two separate systems existed:
-- user_equipped_skins (Phase 2) was built for a different catalog (skins
-- table) that Phase 6's shop never actually sold from. Repointing
-- user_equipped_skins's board/marker FKs at cosmetic_items makes it the real
-- equip-slot table for what's actually purchasable. won_board_x/o columns
-- are left pointed at the old skins table — no cosmetic_items type exists
-- for them yet, out of scope here.
--
-- Marker equip is independent per role (Adam's call): a set purchase grants
-- both glyphs (asset_url = X glyph, asset_url_secondary = O glyph) but
-- equipping writes independently into marker_x_skin_id / marker_o_skin_id,
-- so X and O can come from different owned sets (or just one equipped,
-- leaving the other on its default).

ALTER TABLE public.cosmetic_items ADD COLUMN asset_url_secondary text;

-- Reseed the two marker rows: the original asset_url was a combined X+O
-- preview swatch (a shop thumbnail), not usable as a single in-game glyph.
-- Split into one glyph per column, same palette as the original swatch.
UPDATE public.cosmetic_items SET
  asset_url = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 60%22><rect width=%2260%22 height=%2260%22 fill=%22%23060d1f%22/><text x=%2230%22 y=%2242%22 text-anchor=%22middle%22 font-size=%2234%22 font-family=%22sans-serif%22 font-weight=%22900%22 fill=%22%2300d4aa%22>X</text></svg>',
  asset_url_secondary = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 60%22><rect width=%2260%22 height=%2260%22 fill=%22%23060d1f%22/><text x=%2230%22 y=%2242%22 text-anchor=%22middle%22 font-size=%2234%22 font-family=%22sans-serif%22 font-weight=%22900%22 fill=%22%237c4dff%22>O</text></svg>'
WHERE id = '00000000-0000-0006-0005-000000000001'; -- Neon Set

UPDATE public.cosmetic_items SET
  asset_url = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 60%22><rect width=%2260%22 height=%2260%22 fill=%22%231a2332%22/><text x=%2230%22 y=%2242%22 text-anchor=%22middle%22 font-size=%2234%22 font-family=%22monospace%22 font-weight=%22900%22 fill=%22%23f6ad55%22>X</text></svg>',
  asset_url_secondary = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 60%22><rect width=%2260%22 height=%2260%22 fill=%22%231a2332%22/><text x=%2230%22 y=%2242%22 text-anchor=%22middle%22 font-size=%2234%22 font-family=%22monospace%22 font-weight=%22900%22 fill=%22%23fc8181%22>O</text></svg>'
WHERE id = '00000000-0000-0006-0005-000000000002'; -- Pixel Set

-- Repoint board/marker equip-slot FKs from skins(id) to cosmetic_items(id).
ALTER TABLE public.user_equipped_skins
  DROP CONSTRAINT user_equipped_skins_board_skin_id_fkey,
  DROP CONSTRAINT user_equipped_skins_marker_x_skin_id_fkey,
  DROP CONSTRAINT user_equipped_skins_marker_o_skin_id_fkey;

ALTER TABLE public.user_equipped_skins
  ADD CONSTRAINT user_equipped_skins_board_skin_id_fkey
    FOREIGN KEY (board_skin_id) REFERENCES public.cosmetic_items(id),
  ADD CONSTRAINT user_equipped_skins_marker_x_skin_id_fkey
    FOREIGN KEY (marker_x_skin_id) REFERENCES public.cosmetic_items(id),
  ADD CONSTRAINT user_equipped_skins_marker_o_skin_id_fkey
    FOREIGN KEY (marker_o_skin_id) REFERENCES public.cosmetic_items(id);
