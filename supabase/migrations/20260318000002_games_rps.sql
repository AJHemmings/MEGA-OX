-- Add RPS picks to games table.
-- rps_creator_pick: pick by the player who created the game (player_x_id pre-RPS)
-- rps_joiner_pick:  pick by the player who joined the game (player_o_id pre-RPS)
ALTER TABLE games
  ADD COLUMN rps_creator_pick TEXT,   -- 'rock' | 'paper' | 'scissors' | NULL
  ADD COLUMN rps_joiner_pick  TEXT;   -- 'rock' | 'paper' | 'scissors' | NULL

-- 'rps' is a valid status between 'waiting' and 'active'
-- No enum constraint exists — status is already plain TEXT in this schema.
-- Existing flow: waiting → active
-- New flow:      waiting → rps → active
