-- Allow any authenticated user to join a waiting game they didn't create.
-- The existing update policy only matches rows where the user is already player_x or player_o,
-- which blocks the join action (player_o_id is NULL at that point).
create policy "Authenticated users can join waiting games" on public.games for update
  using (status = 'waiting' and auth.uid() != player_x_id)
  with check (auth.uid() = player_o_id);
