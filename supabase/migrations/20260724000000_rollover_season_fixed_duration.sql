-- Review finding (2026-07-17, re-verified 2026-07-21): forced rollover could
-- create an odd-duration season. The natural cron only ever fires on the 1st
-- of the month ('5 0 1 * *'), so the auto-generate branch's old formula
-- (date_trunc('month', now()) + interval '1 month') always landed on a clean
-- full month there. But admin_end_season's forced path hits this same branch
-- whenever there's no pre-scheduled 'upcoming' season to reuse, and now() can
-- be any day — force-ending mid-July produced a ~17-day season ending
-- August 1 instead of a full month.
--
-- Fix: base end_date on the new season's own start (now()::date + 1 month)
-- instead of snapping to the next calendar-month boundary. This matches
-- admin_create_season's own default end-date formula, and is a no-op for the
-- natural cron path (which only ever runs when now() is already the 1st).
CREATE OR REPLACE FUNCTION public.rollover_season(p_force boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_old record;
  v_new_id uuid;
BEGIN
  SELECT * INTO v_old FROM seasons WHERE status = 'active' FOR UPDATE;
  IF v_old.id IS NULL THEN RAISE EXCEPTION 'rollover_season: no active season'; END IF;
  IF NOT p_force AND now()::date < v_old.end_date THEN RETURN; END IF;

  UPDATE seasons SET status = 'complete' WHERE id = v_old.id;

  PERFORM public.increment_credits(pr.user_id,
            CASE WHEN pr.peak_rating >= 1500 THEN 500
                 WHEN pr.peak_rating >= 1300 THEN 350
                 WHEN pr.peak_rating >= 1100 THEN 250
                 WHEN pr.peak_rating >=  900 THEN 150
                 ELSE 75 END)
  FROM player_ratings pr
  WHERE pr.season_id = v_old.id AND pr.games_played > 0;

  IF v_old.reward_skin_id IS NOT NULL THEN
    INSERT INTO user_skins (user_id, skin_id)
    SELECT pr.user_id, v_old.reward_skin_id
    FROM player_ratings pr
    WHERE pr.season_id = v_old.id AND pr.games_played > 0 AND pr.peak_rating >= 1100
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_new_id FROM seasons WHERE status = 'upcoming' ORDER BY start_date ASC LIMIT 1 FOR UPDATE;

  IF v_new_id IS NOT NULL THEN
    UPDATE seasons SET status = 'active', start_date = now()::date WHERE id = v_new_id;
  ELSE
    INSERT INTO seasons (name, number, start_date, end_date, status)
    VALUES ('Season ' || (v_old.number + 1), v_old.number + 1,
            now()::date, (now()::date + interval '1 month')::date, 'active')
    RETURNING id INTO v_new_id;
  END IF;

  INSERT INTO player_ratings (user_id, season_id, rating, peak_rating)
  SELECT user_id, v_new_id, (rating + 1000) / 2, (rating + 1000) / 2
  FROM player_ratings
  WHERE season_id = v_old.id AND games_played > 0;
END;
$$;
