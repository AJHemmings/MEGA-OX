-- supabase/migrations/20260328000003_phase3_triggers.sql
-- Auto-create player_progression row on profile creation

-- NOTE: The pattern in this project creates player rows via DB triggers,
-- not explicitly in TypeScript. When a profile is created (via signup),
-- the handle_new_profile() trigger in 20260316000000 fires and creates:
--   - player_stats
--   - currency_balance
--   - login_streaks
--
-- This migration extends that pattern to also auto-create player_progression
-- when a new profile is created.

-- Create or replace the handle_new_profile function to include player_progression
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.player_stats (player_id) VALUES (NEW.id);
  INSERT INTO public.currency_balance (player_id) VALUES (NEW.id);
  INSERT INTO public.login_streaks (player_id) VALUES (NEW.id);
  INSERT INTO public.player_progression (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger trg_new_profile already exists and will use the updated function
