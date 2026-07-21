-- Review finding (2026-07-17): tier thresholds (900/1100/1300/1500) were
-- duplicated between rollover_season's SQL and TIERS in src/lib/ranked.ts —
-- and duplicated a second time WITHIN rollover_season itself (the >= 1100
-- check appeared once in the credits CASE, again in the skin-eligibility
-- IF). SQL and TypeScript are different runtimes, so a single literal
-- constant can't span both — but the SQL-internal duplication is fully
-- fixable, and the SQL<->TS gap gets a test-time tripwire instead
-- (src/__tests__/rankedTierSync.test.ts reads this function's thresholds
-- back out of the migration file and fails if they drift from TIERS).
--
-- tier_for_rating is now the ONE place in SQL that encodes the four
-- threshold numbers; rollover_season calls it for both credits and skin
-- eligibility instead of repeating the comparison.
CREATE OR REPLACE FUNCTION public.tier_for_rating(p_rating integer)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN p_rating >= 1500 THEN 'Diamond'
    WHEN p_rating >= 1300 THEN 'Platinum'
    WHEN p_rating >= 1100 THEN 'Gold'
    WHEN p_rating >=  900 THEN 'Silver'
    ELSE 'Bronze'
  END;
$$;

CREATE OR REPLACE FUNCTION public.tier_reward_credits(p_tier text)
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE p_tier
    WHEN 'Diamond'  THEN 500
    WHEN 'Platinum' THEN 350
    WHEN 'Gold'     THEN 250
    WHEN 'Silver'   THEN 150
    ELSE 75
  END;
$$;

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

  PERFORM public.increment_credits(pr.user_id, public.tier_reward_credits(public.tier_for_rating(pr.peak_rating)))
  FROM player_ratings pr
  WHERE pr.season_id = v_old.id AND pr.games_played > 0;

  IF v_old.reward_skin_id IS NOT NULL THEN
    INSERT INTO user_skins (user_id, skin_id)
    SELECT pr.user_id, v_old.reward_skin_id
    FROM player_ratings pr
    WHERE pr.season_id = v_old.id AND pr.games_played > 0
      AND public.tier_for_rating(pr.peak_rating) IN ('Gold', 'Platinum', 'Diamond')
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
