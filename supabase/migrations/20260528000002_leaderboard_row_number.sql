-- 20260528000002_leaderboard_row_number.sql
--
-- Replace rank() with row_number() so tied MMR values produce unique positions.
-- rank() gave every player position=1 when all had default MMR=1000, making
-- the frontend's find(e => e.position === 1/2/3) only ever match one player.
-- row_number() with wins/username tiebreakers always produces unique positions.

CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  row_number() OVER (
    ORDER BY ps.mmr DESC, ps.wins DESC, p.username ASC
  ) AS position,
  p.id AS player_id,
  p.username,
  p.avatar_url,
  p.level,
  ps.rank_tier,
  ps.wins,
  ps.losses,
  ps.draws
FROM public.profiles p
JOIN public.player_stats ps ON ps.player_id = p.id
ORDER BY ps.mmr DESC, ps.wins DESC, p.username ASC
LIMIT 1000;
