-- supabase/migrations/20260328000002_phase3_seed.sql

-- Reward values (admin-tunable without code deploy)
INSERT INTO public.reward_config (key, value) VALUES
  ('xp_game_complete',       20),
  ('xp_win_bonus',           30),
  ('xp_win_hard_ai_bonus',   20),
  ('xp_draw_bonus',          10),
  ('credits_game_complete',  10),
  ('credits_win_bonus',      25),
  ('credits_draw_bonus',     10)
ON CONFLICT (key) DO NOTHING;

-- Achievements catalogue
INSERT INTO public.achievements (key, name, description, condition_key, threshold, reward_xp, reward_credits) VALUES
  ('first_win',      'First Blood',       'Win your first game.',           'total_wins',  1,   50,  25),
  ('win_10_games',   'On a Roll',         'Win 10 games.',                  'total_wins',  10,  100, 50),
  ('win_50_games',   'Dominant',          'Win 50 games.',                  'total_wins',  50,  300, 150),
  ('win_100_games',  'Unstoppable',       'Win 100 games.',                 'total_wins',  100, 500, 250),
  ('play_10_games',  'Getting Started',   'Play 10 games.',                 'total_games', 10,  50,  25),
  ('play_50_games',  'Veteran',           'Play 50 games.',                 'total_games', 50,  150, 75),
  ('play_100_games', 'Century',           'Play 100 games.',                'total_games', 100, 200, 100),
  ('reach_level_10', 'Level 10',          'Reach level 10.',                'level',       10,  0,   100),
  ('reach_level_25', 'Level 25',          'Reach level 25.',                'level',       25,  0,   250),
  ('reach_level_50', 'Level 50',          'Reach level 50.',                'level',       50,  0,   500),
  ('reach_level_100','Level 100',         'Reach level 100.',               'level',       100, 0,   1000),
  ('reach_level_250','Max Level',         'Reach the maximum level (250).', 'level',       250, 0,   2500)
ON CONFLICT (key) DO NOTHING;
