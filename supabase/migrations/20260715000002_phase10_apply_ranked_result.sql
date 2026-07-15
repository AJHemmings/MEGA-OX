-- Phase 10: rating pipeline. ELO lives in SQL so both players' ratings and the
-- game's deltas apply in ONE transaction (the edge function pipeline is
-- sequential, non-transactional — see spec Amendments §3).
-- Client mirror of constants: src/lib/ranked.ts (K schedule, tier bands).

CREATE OR REPLACE FUNCTION public.ensure_player_rating(p_user_id uuid, p_season_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.player_ratings (user_id, season_id)
  VALUES (p_user_id, p_season_id)
  ON CONFLICT (user_id, season_id) DO NOTHING;
$$;

CREATE OR REPLACE FUNCTION public.elo_new_rating(
  p_own integer, p_opp integer, p_score numeric, p_k integer
) RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT p_own + round(p_k * (p_score - 1.0 / (1.0 + power(10.0, (p_opp - p_own) / 400.0))))::integer;
$$;

CREATE OR REPLACE FUNCTION public.apply_ranked_result(p_game_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_game record;
  v_season_id uuid;
  v_x record;
  v_o record;
  v_score_x numeric;
  v_new_x integer;
  v_new_o integer;
BEGIN
  SELECT id, player_x_id, player_o_id, winner, match_type, status, rating_delta_x
    INTO v_game FROM public.games WHERE id = p_game_id FOR UPDATE;

  IF v_game.id IS NULL THEN RAISE EXCEPTION 'apply_ranked_result: game % not found', p_game_id; END IF;
  IF v_game.match_type IS DISTINCT FROM 'ranked' THEN RETURN; END IF;
  IF v_game.status != 'complete' THEN RAISE EXCEPTION 'apply_ranked_result: game % not complete', p_game_id; END IF;
  IF v_game.rating_delta_x IS NOT NULL THEN RETURN; END IF;  -- idempotent no-op
  IF v_game.player_x_id = v_game.player_o_id THEN RETURN; END IF;  -- self-play guard

  -- Rated against the season active at completion time (spec rule)
  SELECT id INTO v_season_id FROM public.seasons WHERE status = 'active';
  IF v_season_id IS NULL THEN RAISE EXCEPTION 'apply_ranked_result: no active season'; END IF;

  PERFORM public.ensure_player_rating(v_game.player_x_id, v_season_id);
  PERFORM public.ensure_player_rating(v_game.player_o_id, v_season_id);

  SELECT * INTO v_x FROM public.player_ratings
   WHERE user_id = v_game.player_x_id AND season_id = v_season_id FOR UPDATE;
  SELECT * INTO v_o FROM public.player_ratings
   WHERE user_id = v_game.player_o_id AND season_id = v_season_id FOR UPDATE;

  v_score_x := CASE v_game.winner WHEN 'X' THEN 1.0 WHEN 'O' THEN 0.0 ELSE 0.5 END;

  v_new_x := public.elo_new_rating(v_x.rating, v_o.rating, v_score_x,
               CASE WHEN v_x.games_played < 10 THEN 32 ELSE 16 END);
  v_new_o := public.elo_new_rating(v_o.rating, v_x.rating, 1.0 - v_score_x,
               CASE WHEN v_o.games_played < 10 THEN 32 ELSE 16 END);

  UPDATE public.player_ratings SET
    rating       = v_new_x,
    peak_rating  = greatest(peak_rating, v_new_x),
    games_played = games_played + 1,
    wins   = wins   + (v_score_x = 1.0)::int,
    losses = losses + (v_score_x = 0.0)::int,
    draws  = draws  + (v_score_x = 0.5)::int
  WHERE user_id = v_game.player_x_id AND season_id = v_season_id;

  UPDATE public.player_ratings SET
    rating       = v_new_o,
    peak_rating  = greatest(peak_rating, v_new_o),
    games_played = games_played + 1,
    wins   = wins   + (v_score_x = 0.0)::int,
    losses = losses + (v_score_x = 1.0)::int,
    draws  = draws  + (v_score_x = 0.5)::int
  WHERE user_id = v_game.player_o_id AND season_id = v_season_id;

  UPDATE public.games
     SET rating_delta_x = v_new_x - v_x.rating,
         rating_delta_o = v_new_o - v_o.rating
   WHERE id = p_game_id;
END;
$$;

-- Only the service role (edge function) may execute; clients cannot.
REVOKE EXECUTE ON FUNCTION public.apply_ranked_result(uuid) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_player_rating(uuid, uuid) FROM public, anon, authenticated;
