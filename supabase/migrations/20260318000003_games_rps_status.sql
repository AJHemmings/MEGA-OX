-- Allow 'rps' as a valid game status (between 'waiting' and 'active')
ALTER TABLE games
  DROP CONSTRAINT IF EXISTS games_status_check;

ALTER TABLE games
  ADD CONSTRAINT games_status_check
  CHECK (status IN ('waiting', 'rps', 'active', 'complete', 'abandoned'));
