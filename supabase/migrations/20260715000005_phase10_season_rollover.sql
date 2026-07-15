-- Phase 10: monthly season rollover.
-- Single function = single transaction: complete-old + rewards + insert-new +
-- soft reset all commit or all roll back. This atomicity is what guarantees
-- there is never an active-season gap (apply_ranked_result and the ranked
-- queue both RAISE on "no active season") — do NOT split into separate calls.
-- Tier thresholds (900/1100/1300/1500) mirror TIERS in src/lib/ranked.ts —
-- keep in sync.

CREATE OR REPLACE FUNCTION public.rollover_season()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_old record;
  v_new_id uuid;
BEGIN
  SELECT * INTO v_old FROM seasons WHERE status = 'active' FOR UPDATE;
  IF v_old.id IS NULL THEN RAISE EXCEPTION 'rollover_season: no active season'; END IF;
  IF now()::date < v_old.end_date THEN RETURN; END IF;  -- guard against early manual runs

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

REVOKE EXECUTE ON FUNCTION public.rollover_season() FROM PUBLIC;

-- Safe unschedule: no-op if the job does not exist yet (idiom from
-- 20260618000001_cleanup_abandoned_games.sql).
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'season-rollover';

SELECT cron.schedule(
  'season-rollover',
  '5 0 1 * *',
  'SELECT public.rollover_season()'
);
