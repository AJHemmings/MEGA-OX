-- The original INSERT policy required auth.uid() = player_x_id.
-- This blocks rematch creation: the rematch swaps who goes first, so the creating player
-- inserts a row where player_x_id = opponentId and player_o_id = auth.uid().
-- Fix: allow insert when the authenticated user is either player.
drop policy "Players can create friendly games" on public.games;

create policy "Players can create friendly games" on public.games for insert
  with check (auth.uid() = player_x_id or auth.uid() = player_o_id);
