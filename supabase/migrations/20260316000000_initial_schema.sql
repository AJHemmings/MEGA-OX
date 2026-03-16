-- ============================================================
-- MEGA-OX Initial Schema
-- ============================================================

-- PROFILES
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  active_marker_id uuid,
  active_board_id uuid,
  active_theme_id uuid,
  role text not null default 'player' check (role in ('player', 'admin')),
  created_at timestamptz default now()
);

-- PLAYER STATS (MMR is hidden — RLS blocks client reads on mmr column)
create table public.player_stats (
  player_id uuid references public.profiles(id) on delete cascade primary key,
  wins integer not null default 0,
  losses integer not null default 0,
  draws integer not null default 0,
  mmr integer not null default 1000,
  rank_tier text not null default 'Challenger'
);

-- GAMES
create table public.games (
  id uuid default gen_random_uuid() primary key,
  player_x_id uuid references public.profiles(id),
  player_o_id uuid references public.profiles(id),
  state jsonb not null default '{}',
  next_player text not null default 'X' check (next_player in ('X', 'O')),
  next_micro_board integer,
  status text not null default 'waiting' check (status in ('waiting', 'active', 'complete', 'abandoned')),
  winner text check (winner in ('X', 'O', 'draw')),
  match_type text not null default 'friendly' check (match_type in ('friendly', 'season', 'tournament')),
  season_id uuid,
  tournament_id uuid,
  game_code text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- GAME MOVES (append-only log)
create table public.game_moves (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  player_id uuid references public.profiles(id) not null,
  micro_board_index integer not null check (micro_board_index between 0 and 8),
  cell_index integer not null check (cell_index between 0 and 8),
  move_number integer not null,
  created_at timestamptz default now()
);

-- MATCHMAKING QUEUE
create table public.matchmaking_queue (
  player_id uuid references public.profiles(id) on delete cascade primary key,
  mmr integer not null,
  match_type text not null default 'friendly' check (match_type in ('friendly', 'season')),
  joined_at timestamptz default now()
);

-- SEASONS
create table public.seasons (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'active', 'complete')),
  rules_config jsonb default '{}'
);

-- SEASON STANDINGS
create table public.season_standings (
  player_id uuid references public.profiles(id) on delete cascade,
  season_id uuid references public.seasons(id) on delete cascade,
  wins integer not null default 0,
  losses integer not null default 0,
  draws integer not null default 0,
  points integer not null default 0,
  rank_position integer,
  primary key (player_id, season_id)
);

-- SEASON PRIZES
create table public.season_prizes (
  id uuid default gen_random_uuid() primary key,
  season_id uuid references public.seasons(id) on delete cascade,
  position integer not null check (position between 1 and 4),
  reward_type text not null check (reward_type in ('coins', 'item', 'both')),
  coin_amount integer,
  item_id uuid,
  claimed boolean not null default false,
  claimed_by uuid references public.profiles(id),
  claimed_at timestamptz
);

-- TOURNAMENTS
create table public.tournaments (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_by uuid references public.profiles(id),
  format text not null default 'single_elim' check (format in ('single_elim', 'round_robin')),
  status text not null default 'upcoming' check (status in ('upcoming', 'registration', 'active', 'complete')),
  start_date timestamptz,
  prize_description text
);

-- TOURNAMENT REGISTRATIONS
create table public.tournament_registrations (
  tournament_id uuid references public.tournaments(id) on delete cascade,
  player_id uuid references public.profiles(id) on delete cascade,
  registered_at timestamptz default now(),
  status text not null default 'registered' check (status in ('registered', 'confirmed', 'waitlisted')),
  primary key (tournament_id, player_id)
);

-- TOURNAMENT PARTICIPANTS (confirmed bracket entries only)
create table public.tournament_participants (
  tournament_id uuid references public.tournaments(id) on delete cascade,
  player_id uuid references public.profiles(id) on delete cascade,
  seed integer,
  eliminated boolean not null default false,
  primary key (tournament_id, player_id)
);

-- COSMETIC ITEMS
create table public.cosmetic_items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null check (type in ('marker', 'board', 'theme')),
  rarity text not null check (rarity in ('common', 'rare', 'epic', 'legendary')),
  animated boolean not null default false,
  asset_url text,
  price integer,
  source text not null check (source in ('shop', 'tournament', 'achievement'))
);

-- Add FK constraints for profiles cosmetic columns (deferred to avoid circular ref)
alter table public.profiles
  add constraint fk_active_marker foreign key (active_marker_id) references public.cosmetic_items(id),
  add constraint fk_active_board foreign key (active_board_id) references public.cosmetic_items(id),
  add constraint fk_active_theme foreign key (active_theme_id) references public.cosmetic_items(id);

-- PLAYER INVENTORY
create table public.player_inventory (
  player_id uuid references public.profiles(id) on delete cascade,
  item_id uuid references public.cosmetic_items(id) on delete cascade,
  acquired_at timestamptz default now(),
  acquisition_source text not null check (acquisition_source in ('purchased', 'tournament', 'achievement')),
  primary key (player_id, item_id)
);

-- CURRENCY BALANCE
create table public.currency_balance (
  player_id uuid references public.profiles(id) on delete cascade primary key,
  coins integer not null default 0 check (coins >= 0)
);

-- TRANSACTIONS
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  player_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in ('purchase', 'reward', 'refund', 'spend')),
  amount integer not null,
  item_id uuid references public.cosmetic_items(id),
  stripe_payment_id text,
  created_at timestamptz default now()
);

-- LOGIN STREAKS
create table public.login_streaks (
  player_id uuid references public.profiles(id) on delete cascade primary key,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_login_date date
);

-- REWARD CATALOG
create table public.reward_catalog (
  id uuid default gen_random_uuid() primary key,
  day_number integer not null unique,
  reward_type text not null check (reward_type in ('coins', 'item')),
  coin_amount integer,
  item_id uuid references public.cosmetic_items(id)
);

-- REWARD CLAIMS
create table public.reward_claims (
  player_id uuid references public.profiles(id) on delete cascade,
  reward_catalog_id uuid references public.reward_catalog(id) on delete cascade,
  claimed_at timestamptz default now(),
  primary key (player_id, reward_catalog_id)
);

-- NEWS POSTS
create table public.news_posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  category text not null check (category in ('update', 'patch', 'season', 'tournament')),
  image_url text,
  published_at timestamptz default now(),
  created_by uuid references public.profiles(id)
);

-- TUTORIAL PROGRESS
create table public.tutorial_progress (
  player_id uuid references public.profiles(id) on delete cascade,
  page_key text not null,
  completed_at timestamptz default now(),
  primary key (player_id, page_key)
);

-- ============================================================
-- LEADERBOARD VIEW (MMR is never returned — position only)
-- ============================================================
create or replace view public.leaderboard as
select
  rank() over (order by ps.mmr desc) as position,
  p.id as player_id,
  p.username,
  p.avatar_url,
  ps.rank_tier,
  ps.wins,
  ps.losses,
  ps.draws
from public.profiles p
join public.player_stats ps on ps.player_id = p.id
order by ps.mmr desc
limit 1000;

-- ============================================================
-- RANK TIER UPDATE FUNCTION + TRIGGER
-- ============================================================
create or replace function update_rank_tier()
returns trigger as $$
begin
  new.rank_tier := case
    when new.mmr >= 2200 then 'Grand Master'
    when new.mmr >= 1900 then 'Master'
    when new.mmr >= 1600 then 'Expert'
    when new.mmr >= 1300 then 'Strategist'
    when new.mmr >= 1100 then 'Tactician'
    when new.mmr >= 900  then 'Challenger'
    else 'Novice'
  end;
  return new;
end;
$$ language plpgsql;

create trigger trg_update_rank_tier
before insert or update of mmr on public.player_stats
for each row execute function update_rank_tier();

-- ============================================================
-- AUTO-CREATE PLAYER ROWS ON SIGNUP
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  -- Profile is created separately (username required)
  -- This trigger creates the supporting rows once a profile exists
  return new;
end;
$$ language plpgsql security definer;

-- This trigger fires when a profile row is created (after username is set)
create or replace function handle_new_profile()
returns trigger as $$
begin
  insert into public.player_stats (player_id) values (new.id);
  insert into public.currency_balance (player_id) values (new.id);
  insert into public.login_streaks (player_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_new_profile
after insert on public.profiles
for each row execute function handle_new_profile();

-- ============================================================
-- UPDATED_AT TRIGGER FOR GAMES
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_games_updated_at
before update on public.games
for each row execute function update_updated_at();
