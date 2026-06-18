-- pg_cron was enabled via Dashboard. This is a no-op safety net.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Cleanup function.
-- SECURITY DEFINER: runs as the function owner (postgres), bypassing RLS.
-- Called by pg_cron only — not callable by authenticated clients (see REVOKE below).
CREATE OR REPLACE FUNCTION cleanup_abandoned_games()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Active games with no move for 10+ minutes → abandoned.
  -- Guard: forfeit_player_id IS NULL prevents overwriting a legitimate forfeit
  -- already written by the remaining player's 90-second countdown.
  UPDATE games
  SET status = 'complete', winner = NULL, forfeit_player_id = NULL
  WHERE status = 'active'
    AND forfeit_player_id IS NULL
    AND updated_at < now() - interval '10 minutes';

  -- RPS games stuck for 30+ minutes → abandoned (both players left before picking).
  UPDATE games
  SET status = 'complete', winner = NULL, forfeit_player_id = NULL
  WHERE status = 'rps'
    AND forfeit_player_id IS NULL
    AND updated_at < now() - interval '30 minutes';

  -- Waiting games (no opponent joined) older than 24 hours → dead lobby.
  UPDATE games
  SET status = 'complete', winner = NULL, forfeit_player_id = NULL
  WHERE status = 'waiting'
    AND forfeit_player_id IS NULL
    AND updated_at < now() - interval '24 hours';

  -- Delete rps_picks for games that have been non-rps for at least 30 minutes.
  -- The 30-minute buffer prevents racing with a game that very recently transitioned
  -- away from rps status — its picks stay until the next cleanup cycle.
  DELETE FROM rps_picks
  WHERE game_id IN (
    SELECT id FROM games
    WHERE status != 'rps'
      AND updated_at < now() - interval '30 minutes'
  );
END;
$$;

-- Prevent authenticated clients from calling this directly via RPC.
REVOKE EXECUTE ON FUNCTION cleanup_abandoned_games() FROM PUBLIC;

-- Schedule every 10 minutes.
-- Safe unschedule: no-op if the job does not exist yet.
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'cleanup-abandoned-games';

SELECT cron.schedule(
  'cleanup-abandoned-games',
  '*/10 * * * *',
  'SELECT cleanup_abandoned_games()'
);
