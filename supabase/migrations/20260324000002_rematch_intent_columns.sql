-- Rematch intent signalling via DB instead of broadcast/presence.
-- Broadcast fallback to REST API does not reliably fan out to WebSocket subscribers,
-- causing one player to never receive the opponent's Play Again intent.
-- Writing intent to the games row lets postgres_changes deliver it on both sides.
alter table public.games
  add column if not exists rematch_x_intent text,
  add column if not exists rematch_o_intent text;
