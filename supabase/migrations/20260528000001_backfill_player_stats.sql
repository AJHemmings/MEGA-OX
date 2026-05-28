-- 20260528000001_backfill_player_stats.sql
--
-- Two problems this fixes:
--
-- 1. Some profiles have no player_stats row (likely from early DB seeding or
--    periods when the handle_new_profile trigger was not yet in place).
--    The leaderboard view inner-joins on player_stats, so these players are
--    invisible to the leaderboard entirely.
--
-- 2. wins/losses/draws in player_stats are 0 for games played before the
--    edge function v8 W/L/D fix. The edge function is the only writer, so
--    any game processed before that fix was never counted.
--
-- Both parts are idempotent — safe to re-run.

-- ── Part 1: insert missing player_stats rows ──────────────────────────────
INSERT INTO public.player_stats (player_id)
SELECT p.id
FROM public.profiles p
LEFT JOIN public.player_stats ps ON ps.player_id = p.id
WHERE ps.player_id IS NULL;

-- ── Part 2: overwrite W/L/D with ground-truth counts from games ──────────
-- We SET (not increment) so the result is correct regardless of how many
-- edge function runs have already partially updated a player's row.
WITH computed AS (
  SELECT
    player_id,
    SUM(CASE WHEN result = 'win'  THEN 1 ELSE 0 END) AS wins,
    SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) AS losses,
    SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) AS draws
  FROM (
    SELECT
      player_x_id AS player_id,
      CASE
        WHEN winner = 'X'    THEN 'win'
        WHEN winner = 'O'    THEN 'loss'
        WHEN winner = 'draw' THEN 'draw'
      END AS result
    FROM public.games
    WHERE status = 'complete'
      AND winner IS NOT NULL
      AND player_x_id IS NOT NULL

    UNION ALL

    SELECT
      player_o_id AS player_id,
      CASE
        WHEN winner = 'O'    THEN 'win'
        WHEN winner = 'X'    THEN 'loss'
        WHEN winner = 'draw' THEN 'draw'
      END AS result
    FROM public.games
    WHERE status = 'complete'
      AND winner IS NOT NULL
      AND player_o_id IS NOT NULL
  ) sides
  GROUP BY player_id
)
UPDATE public.player_stats ps
SET
  wins   = c.wins,
  losses = c.losses,
  draws  = c.draws
FROM computed c
WHERE ps.player_id = c.player_id;
