-- Theme Phase B1: give the three existing theme rows their member manifests.
-- A theme row names its members; it never carries assets (spec §4).
--
-- 'marker' is ONE id populating BOTH marker slots — a marker row carries the
-- X glyph in asset_url and the O glyph in asset_url_secondary.
--
-- Classic omits board/marker deliberately: it has no seeded board/marker rows
-- (the defaults are drawn in code), and per spec §5 an absent key leaves that
-- slot UNCHANGED rather than nulling it.

UPDATE public.cosmetic_items SET config = jsonb_build_object(
  'members', jsonb_build_object(
    'background', '00000000-0000-000b-0001-000000000001',
    'cursor',     '00000000-0000-000b-0002-000000000001',
    'sound_pack', '00000000-0000-000b-0003-000000000001',
    'pill_style', '00000000-0000-000b-0004-000000000001'
  )
) WHERE id = '00000000-0000-0006-0006-000000000002'; -- Classic

UPDATE public.cosmetic_items SET config = jsonb_build_object(
  'members', jsonb_build_object(
    'board',      '00000000-0000-0006-0004-000000000001', -- Neon Grid
    'marker',     '00000000-0000-0006-0005-000000000001', -- Neon Set
    'background', '00000000-0000-000b-0001-000000000002',
    'cursor',     '00000000-0000-000b-0002-000000000002',
    'sound_pack', '00000000-0000-000b-0003-000000000002',
    'pill_style', '00000000-0000-000b-0004-000000000002'
  )
) WHERE id = '00000000-0000-0006-0006-000000000001'; -- Dark Neon

UPDATE public.cosmetic_items SET config = jsonb_build_object(
  'members', jsonb_build_object(
    'board',      '00000000-0000-0006-0004-000000000002', -- Minimal
    'marker',     '00000000-0000-0006-0005-000000000002', -- Pixel Set
    'background', '00000000-0000-000b-0001-000000000003',
    'cursor',     '00000000-0000-000b-0002-000000000003',
    'sound_pack', '00000000-0000-000b-0003-000000000003',
    'pill_style', '00000000-0000-000b-0004-000000000003'
  )
) WHERE id = '00000000-0000-0006-0006-000000000003'; -- Ember
