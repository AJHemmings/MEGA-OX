-- supabase/migrations/20260328000001_phase3_schema.sql

-- player_progression: XP, level, lifetime credits earned
CREATE TABLE public.player_progression (
  user_id              uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  xp                   integer NOT NULL DEFAULT 0,
  level                integer NOT NULL DEFAULT 1,
  total_credits_earned integer NOT NULL DEFAULT 0
);

-- RLS: users read their own row only; edge function uses service role
ALTER TABLE public.player_progression ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own progression"
  ON public.player_progression FOR SELECT
  USING (auth.uid() = user_id);

-- achievements catalogue (admin manages this via Phase 7 admin page)
CREATE TABLE public.achievements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key           text UNIQUE NOT NULL,
  name          text NOT NULL,
  description   text NOT NULL,
  condition_key text NOT NULL, -- 'total_wins' | 'total_games' | 'level' | 'total_credits_earned'
  threshold     integer NOT NULL,
  reward_xp     integer NOT NULL DEFAULT 0,
  reward_credits integer NOT NULL DEFAULT 0,
  reward_skin_id uuid REFERENCES public.skins,
  icon_url      text
);

-- Public read for achievements catalogue
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievements are publicly readable"
  ON public.achievements FOR SELECT
  USING (true);

-- player_achievements: what each player has unlocked
CREATE TABLE public.player_achievements (
  user_id        uuid REFERENCES auth.users ON DELETE CASCADE,
  achievement_id uuid REFERENCES public.achievements ON DELETE CASCADE,
  unlocked_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

ALTER TABLE public.player_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own achievements"
  ON public.player_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- reward_config: all award values — editable by admin without code deploy
CREATE TABLE public.reward_config (
  key   text PRIMARY KEY,
  value integer NOT NULL
);

-- Public read so client can show expected rewards
ALTER TABLE public.reward_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reward config is publicly readable"
  ON public.reward_config FOR SELECT
  USING (true);

-- Add rewards_status and retry tracking to games
ALTER TABLE public.games
  ADD COLUMN rewards_status      text NOT NULL DEFAULT 'pending',
  ADD COLUMN rewards_retry_count integer NOT NULL DEFAULT 0;

-- Add public level to profiles
ALTER TABLE public.profiles
  ADD COLUMN level integer NOT NULL DEFAULT 1;
