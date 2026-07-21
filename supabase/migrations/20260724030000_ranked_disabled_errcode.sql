-- Review finding (2026-07-17): the ranked kill-switch signal from
-- join_matchmaking_queue was a bare RAISE EXCEPTION 'ranked_disabled', and
-- the client detected it via rpcErr.message.includes('ranked_disabled') —
-- a substring match against free-form exception text, fragile to message
-- wording changes. Give it a real custom SQLSTATE ('RANK1', not used by any
-- built-in Postgres error class) so the client can match on error.code.
CREATE OR REPLACE FUNCTION public.join_matchmaking_queue(p_match_type text, p_initial_state jsonb)
 RETURNS TABLE(out_game_id uuid, out_opponent_id uuid)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_uid       uuid := auth.uid();
  v_opp_id    uuid;
  v_game_id   uuid;
  v_season_id uuid;
  v_my_rating integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('mm_' || p_match_type));

  DELETE FROM matchmaking_queue WHERE user_id = v_uid;

  IF p_match_type = 'ranked' THEN
    -- Kill switch: block NEW ranked queue entries. Any already-searching
    -- rows are cleared immediately by admin_set_config when the flag flips
    -- off (see 20260724020000_kill_switch_queue_cleanup.sql).
    IF COALESCE((SELECT value = 'true'::jsonb FROM app_config WHERE key = 'ranked_enabled'), true) IS NOT TRUE THEN
      RAISE EXCEPTION 'Ranked matchmaking is currently disabled' USING ERRCODE = 'RANK1';
    END IF;

    SELECT id INTO v_season_id FROM seasons WHERE status = 'active';
    IF v_season_id IS NULL THEN RAISE EXCEPTION 'No active season'; END IF;
    PERFORM public.ensure_player_rating(v_uid, v_season_id);
    SELECT rating INTO v_my_rating FROM player_ratings
     WHERE user_id = v_uid AND season_id = v_season_id;

    SELECT mq.user_id INTO v_opp_id
    FROM matchmaking_queue mq
    JOIN player_ratings pr
      ON pr.user_id = mq.user_id AND pr.season_id = v_season_id
    WHERE mq.status = 'searching'
      AND mq.user_id != v_uid
      AND mq.match_type = 'ranked'
      AND mq.created_at > now() - interval '10 minutes'
      AND (
        extract(epoch FROM now() - mq.created_at) >= 60
        OR abs(pr.rating - v_my_rating)
             <= 150 + 100 * floor(extract(epoch FROM now() - mq.created_at) / 15)
      )
    ORDER BY mq.created_at ASC
    LIMIT 1;
  ELSE
    SELECT mq.user_id INTO v_opp_id
    FROM matchmaking_queue mq
    WHERE mq.status = 'searching'
      AND mq.user_id != v_uid
      AND mq.match_type = p_match_type
      AND mq.created_at > now() - interval '10 minutes'
    ORDER BY mq.created_at ASC
    LIMIT 1;
  END IF;

  IF v_opp_id IS NOT NULL THEN
    INSERT INTO games (player_x_id, player_o_id, state, match_type, status)
    VALUES (v_opp_id, v_uid, p_initial_state, p_match_type, 'waiting')
    RETURNING id INTO v_game_id;

    UPDATE matchmaking_queue
       SET status = 'matched', game_id = v_game_id
     WHERE user_id = v_opp_id AND status = 'searching';

    INSERT INTO matchmaking_queue (user_id, match_type, status, game_id)
    VALUES (v_uid, p_match_type, 'matched', v_game_id);

    out_game_id     := v_game_id;
    out_opponent_id := v_opp_id;
    RETURN NEXT;
  ELSE
    INSERT INTO matchmaking_queue (user_id, match_type, status)
    VALUES (v_uid, p_match_type, 'searching');

    out_game_id     := null;
    out_opponent_id := null;
    RETURN NEXT;
  END IF;
END;
$function$;
