-- 20260520000002_progression_public_read.sql
-- Allow any authenticated user to read any player's progression.
-- The original policy was "own row only", which meant viewing another player's profile
-- returned null for their level → always showed level 1.
-- Level and XP are public profile data, not private.

DROP POLICY IF EXISTS "Users can read own progression" ON public.player_progression;

CREATE POLICY "Authenticated users can read any progression"
  ON public.player_progression FOR SELECT
  TO authenticated
  USING (true);
