-- Neon marker glyphs rendered far smaller than other markers: the text glyph
-- only filled ~40% of its 60x60 viewBox (font-size 34) vs ~85%+ for the
-- hand-drawn defaults (Xan/Mo). Also drops the opaque background rect, which
-- painted a solid square behind the letter instead of a transparent marker.
UPDATE public.cosmetic_items SET
  asset_url = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 60%22><text x=%2230%22 y=%2252%22 text-anchor=%22middle%22 font-size=%2262%22 font-family=%22sans-serif%22 font-weight=%22900%22 fill=%22%2300d4aa%22>X</text></svg>',
  asset_url_secondary = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 60%22><text x=%2230%22 y=%2252%22 text-anchor=%22middle%22 font-size=%2262%22 font-family=%22sans-serif%22 font-weight=%22900%22 fill=%22%237c4dff%22>O</text></svg>'
WHERE id = '00000000-0000-0006-0005-000000000001'; -- Neon Set
