ALTER TABLE games
  ADD COLUMN forfeit_player_id uuid REFERENCES auth.users(id);
