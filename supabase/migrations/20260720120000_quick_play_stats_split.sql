-- Separates quick-play (casual) W/L/D from lifetime totals on player_stats.
--
-- player_stats.wins/losses/draws is incremented unconditionally for every
-- completed game in post-game-handler, regardless of match_type — it feeds
-- the total_wins/total_games achievement conditions and stays that way by
-- design (ranked wins should still count toward achievements).
--
-- These new columns back the profile's visible "Quick Play" tile and only
-- count match_type = 'friendly' games, so ranked results (already tracked
-- separately, season-scoped, in player_ratings) don't bleed into the
-- casual W/L/D a player sees on their profile.

ALTER TABLE public.player_stats
  ADD COLUMN IF NOT EXISTS quick_wins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quick_losses integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quick_draws integer NOT NULL DEFAULT 0;

-- Backfill from actual game history (not the existing lifetime counters),
-- so this is exact regardless of any ranked games already played during
-- Phase 10 testing. Each completed 'friendly' game is counted once per
-- side, matching how post-game-handler is invoked per player.
WITH friendly_results AS (
  SELECT player_x_id AS player_id,
         count(*) FILTER (WHERE winner = 'X')    AS wins,
         count(*) FILTER (WHERE winner = 'O')    AS losses,
         count(*) FILTER (WHERE winner = 'draw') AS draws
    FROM public.games
   WHERE match_type = 'friendly' AND status = 'complete' AND player_x_id IS NOT NULL
   GROUP BY player_x_id
  UNION ALL
  SELECT player_o_id AS player_id,
         count(*) FILTER (WHERE winner = 'O')    AS wins,
         count(*) FILTER (WHERE winner = 'X')    AS losses,
         count(*) FILTER (WHERE winner = 'draw') AS draws
    FROM public.games
   WHERE match_type = 'friendly' AND status = 'complete' AND player_o_id IS NOT NULL
   GROUP BY player_o_id
),
totals AS (
  SELECT player_id, sum(wins) AS wins, sum(losses) AS losses, sum(draws) AS draws
    FROM friendly_results
   GROUP BY player_id
)
UPDATE public.player_stats ps
   SET quick_wins   = totals.wins,
       quick_losses = totals.losses,
       quick_draws  = totals.draws
  FROM totals
 WHERE ps.player_id = totals.player_id;
