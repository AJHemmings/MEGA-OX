-- Phase 10: ranked ladder + seasons — schema
-- season_standings / season_prizes: dormant Phase-0 tables (0 rows, verified
-- 2026-07-15), points/top-4 model incompatible with tier-based ranked. Dropped.
DROP TABLE IF EXISTS public.season_prizes;
DROP TABLE IF EXISTS public.season_standings;

ALTER TABLE public.seasons
  ADD COLUMN IF NOT EXISTS number integer UNIQUE,
  ADD COLUMN IF NOT EXISTS reward_skin_id uuid REFERENCES public.skins(id);

-- Exactly one active season at a time
CREATE UNIQUE INDEX IF NOT EXISTS seasons_one_active
  ON public.seasons (status) WHERE status = 'active';

CREATE TABLE public.player_ratings (
  user_id      uuid    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  season_id    uuid    NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  rating       integer NOT NULL DEFAULT 1000,
  peak_rating  integer NOT NULL DEFAULT 1000,
  games_played integer NOT NULL DEFAULT 0,
  wins         integer NOT NULL DEFAULT 0,
  losses       integer NOT NULL DEFAULT 0,
  draws        integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, season_id)
);
CREATE INDEX player_ratings_season_rating
  ON public.player_ratings (season_id, rating DESC);

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS rating_delta_x integer,
  ADD COLUMN IF NOT EXISTS rating_delta_o integer;

-- RLS: world-readable (rating is public by design), writable by nobody —
-- all writes go through SECURITY DEFINER functions / service role.
-- No self-referencing policies (Phase 7 recursion lesson).
-- (seasons already has "Seasons are publicly readable" from the initial RLS
-- migration — no new seasons policy needed.)
ALTER TABLE public.player_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY player_ratings_read ON public.player_ratings
  FOR SELECT TO authenticated USING (true);

INSERT INTO public.seasons (name, number, start_date, end_date, status)
VALUES ('Season 1', 1, current_date,
        (date_trunc('month', now()) + interval '1 month')::date, 'active');
