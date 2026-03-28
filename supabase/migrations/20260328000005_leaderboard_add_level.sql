-- supabase/migrations/20260328000005_leaderboard_add_level.sql
-- Add level to leaderboard view so clients can render LevelBadge

create or replace view public.leaderboard as
select
  rank() over (order by ps.mmr desc) as position,
  p.id as player_id,
  p.username,
  p.avatar_url,
  p.level,
  ps.rank_tier,
  ps.wins,
  ps.losses,
  ps.draws
from public.profiles p
join public.player_stats ps on ps.player_id = p.id
order by ps.mmr desc
limit 1000;
