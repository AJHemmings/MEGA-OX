-- Admin ranked controls: ranked_enabled kill switch + forced season rollover.
-- Grants rule (2026-07-16): Supabase default privileges grant EXECUTE to
-- anon/authenticated explicitly — REVOKE FROM PUBLIC alone is insufficient
-- (advisor lint 0028). Service/cron-only fns: revoke all three roles.
-- Admin RPCs with internal guards: revoke PUBLIC+anon, grant authenticated.

-- ── 1. app_config ─────────────────────────────────────────────────────────
CREATE TABLE public.app_config (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.app_config (key, value) VALUES ('ranked_enabled', 'true'::jsonb);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
-- Public read (anon included): flags gate public UI; no write policies —
-- writes only via admin_set_config below.
CREATE POLICY app_config_read ON public.app_config
  FOR SELECT TO anon, authenticated USING (true);

-- ── 2. admin_set_config ───────────────────────────────────────────────────
CREATE FUNCTION public.admin_set_config(p_key text, p_value jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  INSERT INTO public.app_config (key, value, updated_at)
  VALUES (p_key, p_value, now())
  ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now();
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_set_config(text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_config(text, jsonb) TO authenticated;

-- ── 3. rollover_season gains p_force ──────────────────────────────────────
-- CREATE OR REPLACE cannot add a parameter → DROP + recreate. Grants do NOT
-- survive the DROP: re-apply the three-role REVOKE. The cron job stores the
-- command text 'SELECT public.rollover_season()' — still resolves via the
-- DEFAULT, no re-schedule needed.
DROP FUNCTION public.rollover_season();

-- Single function = single transaction: complete-old + rewards + insert-new +
-- soft reset all commit or all roll back — never an active-season gap
-- (apply_ranked_result and the ranked queue both RAISE on "no active season").
-- Tier thresholds (900/1100/1300/1500) mirror TIERS in src/lib/ranked.ts —
-- keep in sync.
CREATE FUNCTION public.rollover_season(p_force boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_old record;
  v_new_id uuid;
BEGIN
  SELECT * INTO v_old FROM seasons WHERE status = 'active' FOR UPDATE;
  IF v_old.id IS NULL THEN RAISE EXCEPTION 'rollover_season: no active season'; END IF;
  -- Early-run guard (cron fires on the 1st; manual admin runs pass p_force).
  IF NOT p_force AND now()::date < v_old.end_date THEN RETURN; END IF;

  UPDATE seasons SET status = 'complete' WHERE id = v_old.id;

  -- Tier rewards from peak_rating. Credits for every tier (incl. Bronze/Silver);
  -- the season skin only for Gold+ (>= 1100) and only when reward_skin_id is
  -- configured — a missing skin skips the grant, never fails the rollover
  -- (the admin dashboard warns when it is unset).
  PERFORM public.increment_credits(pr.user_id,
            CASE WHEN pr.peak_rating >= 1500 THEN 500   -- Diamond
                 WHEN pr.peak_rating >= 1300 THEN 350   -- Platinum
                 WHEN pr.peak_rating >= 1100 THEN 250   -- Gold
                 WHEN pr.peak_rating >=  900 THEN 150   -- Silver
                 ELSE 75 END)                            -- Bronze
  FROM player_ratings pr
  WHERE pr.season_id = v_old.id AND pr.games_played > 0;

  IF v_old.reward_skin_id IS NOT NULL THEN
    INSERT INTO user_skins (user_id, skin_id)
    SELECT pr.user_id, v_old.reward_skin_id
    FROM player_ratings pr
    WHERE pr.season_id = v_old.id AND pr.games_played > 0 AND pr.peak_rating >= 1100
    ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO seasons (name, number, start_date, end_date, status)
  VALUES ('Season ' || (v_old.number + 1), v_old.number + 1,
          now()::date, (date_trunc('month', now()) + interval '1 month')::date, 'active')
  RETURNING id INTO v_new_id;

  -- Soft reset: pull returning players toward 1000. Players who queued but
  -- completed zero games get a fresh 1000 row on next queue entry instead.
  INSERT INTO player_ratings (user_id, season_id, rating, peak_rating)
  SELECT user_id, v_new_id, (rating + 1000) / 2, (rating + 1000) / 2
  FROM player_ratings
  WHERE season_id = v_old.id AND games_played > 0;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.rollover_season(boolean) FROM PUBLIC, anon, authenticated;

-- ── 4. admin_end_season ───────────────────────────────────────────────────
CREATE FUNCTION public.admin_end_season()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  PERFORM public.rollover_season(p_force := true);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_end_season() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_end_season() TO authenticated;

-- ── 5. join_matchmaking_queue: ranked kill-switch check ───────────────────
-- Full re-capture of the applied definition (...000003) + the flag check.
-- Tolerance formula MUST stay in sync with src/lib/ranked.ts:
--   tolerance = 150 + 100 * floor(wait_seconds / 15), uncapped from 60s.
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
    -- Kill switch: block NEW ranked queue entries only. In-progress games
    -- still rate; already-searching players simply never pair (accepted).
    IF COALESCE((SELECT value = 'true'::jsonb FROM app_config WHERE key = 'ranked_enabled'), true) IS NOT TRUE THEN
      RAISE EXCEPTION 'ranked_disabled';
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
