-- Scheduled seasons: admin picks a start AND end date. A future start date
-- means the season isn't live yet — it sits as 'upcoming' (already a valid
-- status per the original schema's check constraint, just never used) until
-- a daily job promotes it. This also lets an admin pre-schedule the NEXT
-- season while the current one is still active; the monthly rollover then
-- reuses that scheduled season instead of always auto-generating one.

-- 1. admin_create_season gains p_start_date. CREATE OR REPLACE cannot add a
--    parameter → DROP + recreate (same reasoning as rollover_season's own
--    p_force addition in 20260716000001).
DROP FUNCTION public.admin_create_season(text, date);

CREATE FUNCTION public.admin_create_season(p_name text DEFAULT NULL, p_start_date date DEFAULT NULL, p_end_date date DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_next_number integer;
  v_start date;
  v_end date;
  v_status text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- One scheduled season at a time, whether or not one is currently active.
  IF EXISTS (SELECT 1 FROM public.seasons WHERE status = 'upcoming') THEN
    RAISE EXCEPTION 'admin_create_season: a season is already scheduled';
  END IF;

  v_start := COALESCE(p_start_date, now()::date);
  v_end   := COALESCE(p_end_date, (v_start + interval '1 month')::date);
  IF v_end <= v_start THEN
    RAISE EXCEPTION 'admin_create_season: end date must be after start date';
  END IF;

  v_status := CASE WHEN v_start <= now()::date THEN 'active' ELSE 'upcoming' END;

  IF v_status = 'active' AND EXISTS (SELECT 1 FROM public.seasons WHERE status = 'active') THEN
    RAISE EXCEPTION 'admin_create_season: a season is already active — pick a future start date to schedule the next one';
  END IF;

  SELECT COALESCE(MAX(number), 0) + 1 INTO v_next_number FROM public.seasons;

  INSERT INTO public.seasons (name, number, start_date, end_date, status)
  VALUES (COALESCE(p_name, 'Season ' || v_next_number), v_next_number, v_start, v_end, v_status);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_create_season(text, date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_season(text, date, date) TO authenticated;

-- 2. Daily promotion of a scheduled season once its start date arrives — only
--    when there is genuinely no active season (a gap), never early. Cron/
--    service-only: an admin wanting a season live immediately just creates it
--    with start_date = today via admin_create_season directly.
CREATE FUNCTION public.activate_scheduled_season()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.seasons WHERE status = 'active') THEN RETURN; END IF;

  SELECT id INTO v_id FROM public.seasons
   WHERE status = 'upcoming' AND start_date <= now()::date
   ORDER BY start_date ASC LIMIT 1 FOR UPDATE;

  IF v_id IS NULL THEN RETURN; END IF;

  UPDATE public.seasons SET status = 'active' WHERE id = v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.activate_scheduled_season() FROM PUBLIC, anon, authenticated;

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'activate-scheduled-season';
SELECT cron.schedule(
  'activate-scheduled-season',
  '15 0 * * *',
  'SELECT public.activate_scheduled_season()'
);

-- 3. rollover_season: reuse a pre-scheduled 'upcoming' season instead of
--    always auto-generating "Season N+1" when one exists. Activates it now
--    (start_date := today) rather than waiting for its originally-planned
--    date, since letting the gap ride until then would violate the "always
--    one active season" invariant apply_ranked_result/join_matchmaking_queue
--    both rely on. end_date is left exactly as the admin scheduled it.
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
            now()::date, (date_trunc('month', now()) + interval '1 month')::date, 'active')
    RETURNING id INTO v_new_id;
  END IF;

  INSERT INTO player_ratings (user_id, season_id, rating, peak_rating)
  SELECT user_id, v_new_id, (rating + 1000) / 2, (rating + 1000) / 2
  FROM player_ratings
  WHERE season_id = v_old.id AND games_played > 0;
END;
$$;
