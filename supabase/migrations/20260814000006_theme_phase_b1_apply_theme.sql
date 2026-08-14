-- Theme Phase B1: apply_theme — eager, atomic, server-side theme application
-- (spec §5). Copies a theme's member item IDs into the player's slot columns.
-- After this returns, the theme has NO ongoing authority: swapping one item is
-- an ordinary equip with no precedence logic, and re-applying the theme is the
-- reset. active_theme_id is a "last applied" LABEL only — never an input to
-- render resolution.
--
-- Why an RPC rather than useLoadout.save(): save() cannot grant a member
-- missing from inventory (an admin can edit a theme's membership after
-- purchase), and it trusts the client about ownership.

CREATE OR REPLACE FUNCTION public.apply_theme(p_theme_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id UUID;
  v_type      TEXT;
  v_members   JSONB;
  v_loadout   JSONB;
BEGIN
  v_player_id := auth.uid();
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT type, config->'members' INTO v_type, v_members
  FROM public.cosmetic_items WHERE id = p_theme_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'theme_not_found');
  END IF;

  IF v_type IS DISTINCT FROM 'theme' THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_a_theme');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.player_inventory
    WHERE player_id = v_player_id AND item_id = p_theme_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_owned');
  END IF;

  -- A malformed theme fails LOUDLY here rather than half-applying. The §5
  -- degradation rules govern RENDERING, not application.
  IF v_members IS NULL OR jsonb_typeof(v_members) <> 'object'
     OR v_members = '{}'::jsonb THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_members');
  END IF;

  -- Backfill any member the player doesn't already own. Ignores ids that
  -- don't resolve, so a stale manifest can't fail the whole apply on an FK.
  INSERT INTO public.player_inventory (player_id, item_id, acquisition_source)
  SELECT v_player_id, (m.value #>> '{}')::uuid, 'theme_bundle'
  FROM jsonb_each(v_members) AS m
  WHERE EXISTS (
    SELECT 1 FROM public.cosmetic_items ci
    WHERE ci.id = (m.value #>> '{}')::uuid
  )
  ON CONFLICT (player_id, item_id) DO NOTHING;

  -- Write every slot atomically. COALESCE(new, existing) is load-bearing: an
  -- absent member key leaves that slot UNCHANGED rather than nulling it.
  -- 'marker' populates BOTH marker columns — one row carries both glyphs.
  UPDATE public.profiles SET
    active_board_id      = COALESCE((v_members->>'board')::uuid,      active_board_id),
    active_marker_id     = COALESCE((v_members->>'marker')::uuid,     active_marker_id),
    active_marker_o_id   = COALESCE((v_members->>'marker')::uuid,     active_marker_o_id),
    active_background_id = COALESCE((v_members->>'background')::uuid, active_background_id),
    active_cursor_id     = COALESCE((v_members->>'cursor')::uuid,     active_cursor_id),
    active_sound_pack_id = COALESCE((v_members->>'sound_pack')::uuid, active_sound_pack_id),
    active_pill_style_id = COALESCE((v_members->>'pill_style')::uuid, active_pill_style_id),
    active_theme_id      = p_theme_id
  WHERE id = v_player_id
  RETURNING jsonb_build_object(
    'active_avatar_id',     active_avatar_id,
    'active_badge_id',      active_badge_id,
    'active_banner_id',     active_banner_id,
    'active_board_id',      active_board_id,
    'active_marker_id',     active_marker_id,
    'active_marker_o_id',   active_marker_o_id,
    'active_background_id', active_background_id,
    'active_cursor_id',     active_cursor_id,
    'active_sound_pack_id', active_sound_pack_id,
    'active_pill_style_id', active_pill_style_id
  ) INTO v_loadout;

  IF v_loadout IS NULL THEN
    -- No profiles row for this authenticated user (the missing-profile class
    -- of bug from 2026-07-22). Fail loudly rather than reporting success.
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  RETURN jsonb_build_object('success', true, 'loadout', v_loadout);
END;
$$;

-- Supabase's DEFAULT PRIVILEGES grant EXECUTE to anon and authenticated
-- EXPLICITLY, so revoking PUBLIC alone leaves the function callable. Revoke
-- all three, then grant back only what's needed. Verify with advisor lint 0028.
REVOKE ALL ON FUNCTION public.apply_theme(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_theme(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.apply_theme(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.apply_theme(UUID) TO authenticated;
