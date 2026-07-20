-- Phase 10 fix: player_ratings must be readable by anon too — the leaderboard
-- page is public and the spec makes ratings public by design. The original
-- policy said TO authenticated, which silently returned zero rows to
-- logged-out visitors (RLS default-deny filters, it does not error).
DROP POLICY IF EXISTS player_ratings_read ON public.player_ratings;
CREATE POLICY player_ratings_read ON public.player_ratings
  FOR SELECT TO anon, authenticated USING (true);
