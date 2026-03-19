-- Adds forfeit_player_id to games.
-- Set when a player disconnects during an active game and fails to reconnect
-- within the 90-second grace period. The waiting player's client writes this
-- field alongside status='complete' and winner=<waiting player's marker>.
ALTER TABLE games
  ADD COLUMN forfeit_player_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
