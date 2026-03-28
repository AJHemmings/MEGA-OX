-- Skin catalog
CREATE TABLE skins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('board','marker_x','marker_o','won_board_x','won_board_o')),
  asset_url   TEXT NOT NULL DEFAULT 'placeholder',
  price       INTEGER,  -- NULL until Phase 6
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User inventory: one row = ownership
CREATE TABLE user_skins (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skin_id     UUID NOT NULL REFERENCES skins(id) ON DELETE CASCADE,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, skin_id)
);

-- User equipped slots (one row per user, all nullable)
CREATE TABLE user_equipped_skins (
  user_id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  board_skin_id       UUID REFERENCES skins(id),
  marker_x_skin_id    UUID REFERENCES skins(id),
  marker_o_skin_id    UUID REFERENCES skins(id),
  won_board_x_skin_id UUID REFERENCES skins(id),
  won_board_o_skin_id UUID REFERENCES skins(id)
);

-- Seed default skins
INSERT INTO skins (id, name, type, asset_url) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Default Board',        'board',        'placeholder'),
  ('00000000-0000-0000-0000-000000000002', 'Default X',            'marker_x',     'placeholder'),
  ('00000000-0000-0000-0000-000000000003', 'Default O',            'marker_o',     'placeholder'),
  ('00000000-0000-0000-0000-000000000004', 'Default Won Board X',  'won_board_x',  'placeholder'),
  ('00000000-0000-0000-0000-000000000005', 'Default Won Board O',  'won_board_o',  'placeholder');

-- RLS: users can read all skins; only service role can insert
ALTER TABLE skins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read skins" ON skins FOR SELECT USING (true);

ALTER TABLE user_skins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own inventory" ON user_skins
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE user_equipped_skins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own equipped skins" ON user_equipped_skins
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
