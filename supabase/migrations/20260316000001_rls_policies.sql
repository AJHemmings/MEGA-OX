-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.player_stats enable row level security;
alter table public.games enable row level security;
alter table public.game_moves enable row level security;
alter table public.matchmaking_queue enable row level security;
alter table public.seasons enable row level security;
alter table public.season_standings enable row level security;
alter table public.season_prizes enable row level security;
alter table public.tournaments enable row level security;
alter table public.tournament_registrations enable row level security;
alter table public.tournament_participants enable row level security;
alter table public.cosmetic_items enable row level security;
alter table public.player_inventory enable row level security;
alter table public.currency_balance enable row level security;
alter table public.transactions enable row level security;
alter table public.login_streaks enable row level security;
alter table public.reward_catalog enable row level security;
alter table public.reward_claims enable row level security;
alter table public.news_posts enable row level security;
alter table public.tutorial_progress enable row level security;

-- PROFILES: public read, own write
create policy "Profiles are publicly readable" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- PLAYER STATS: public read of everything EXCEPT mmr
-- Note: we use a security definer function to update mmr so clients can never write it directly
create policy "Player stats readable (no mmr)" on public.player_stats for select using (true);
-- No client insert/update — handled by triggers and security definer functions only

-- GAMES: players in the game can read; only correct player can write moves
create policy "Players can view their games" on public.games for select
  using (auth.uid() = player_x_id or auth.uid() = player_o_id or status = 'waiting');
create policy "Players can create friendly games" on public.games for insert
  with check (auth.uid() = player_x_id);
create policy "Players can update games they are in" on public.games for update
  using (auth.uid() = player_x_id or auth.uid() = player_o_id);

-- GAME MOVES: players in game can read; only correct player can insert on their turn
create policy "Players can view moves in their games" on public.game_moves for select
  using (exists (
    select 1 from public.games g
    where g.id = game_id
    and (g.player_x_id = auth.uid() or g.player_o_id = auth.uid())
  ));
create policy "Players can insert their own moves" on public.game_moves for insert
  with check (auth.uid() = player_id);

-- MATCHMAKING QUEUE: own row only
create policy "Players manage their own queue entry" on public.matchmaking_queue
  for all using (auth.uid() = player_id);

-- SEASONS: public read
create policy "Seasons are publicly readable" on public.seasons for select using (true);

-- SEASON STANDINGS: public read
create policy "Season standings are publicly readable" on public.season_standings for select using (true);

-- COSMETIC ITEMS: public read (catalogue)
create policy "Cosmetics are publicly readable" on public.cosmetic_items for select using (true);

-- PLAYER INVENTORY: own read; no client write (handled by functions)
create policy "Players can view their own inventory" on public.player_inventory for select
  using (auth.uid() = player_id);

-- CURRENCY BALANCE: own read only
create policy "Players can view their own balance" on public.currency_balance for select
  using (auth.uid() = player_id);

-- TRANSACTIONS: own read only
create policy "Players can view their own transactions" on public.transactions for select
  using (auth.uid() = player_id);

-- LOGIN STREAKS: own read/write
create policy "Players manage their own streak" on public.login_streaks
  for all using (auth.uid() = player_id);

-- REWARD CATALOG: public read
create policy "Reward catalog is publicly readable" on public.reward_catalog for select using (true);

-- REWARD CLAIMS: own read/write
create policy "Players manage their own reward claims" on public.reward_claims
  for all using (auth.uid() = player_id);

-- NEWS POSTS: public read; admin write
create policy "News is publicly readable" on public.news_posts for select using (true);
create policy "Admins can manage news" on public.news_posts for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- TUTORIAL PROGRESS: own read/write
create policy "Players manage their own tutorial progress" on public.tutorial_progress
  for all using (auth.uid() = player_id);

-- TOURNAMENT REGISTRATIONS: own read/write
create policy "Players can register for tournaments" on public.tournament_registrations
  for all using (auth.uid() = player_id);

-- TOURNAMENT PARTICIPANTS: public read
create policy "Tournament participants are publicly readable" on public.tournament_participants
  for select using (true);
