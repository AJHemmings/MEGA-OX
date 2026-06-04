-- Phase 7: Admin Dashboard
-- Creates admin_roles, ai_config; adds visible/featured/archived to cosmetic_items; RLS policies.

-- ── 1. admin_roles ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('super_admin', 'editor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_roles_self_read" ON public.admin_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "admin_roles_super_read" ON public.admin_roles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "admin_roles_super_write" ON public.admin_roles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- ── 2. ai_config ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_config (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('medium', 'hard')),
  rule_name  TEXT NOT NULL,
  strength   INTEGER NOT NULL CHECK (strength >= 0 AND strength <= 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id),
  UNIQUE (difficulty, rule_name),
  CONSTRAINT ai_config_minimax_depth_range
    CHECK (rule_name <> 'minimax_depth' OR (strength >= 1 AND strength <= 5))
);

ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_config_public_read" ON public.ai_config
  FOR SELECT USING (true);

CREATE POLICY "ai_config_super_write" ON public.ai_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

INSERT INTO public.ai_config (difficulty, rule_name, strength) VALUES
  ('medium', 'win_rule_strength',      80),
  ('medium', 'poison_filter_strength', 70),
  ('hard',   'win_rule_strength',      95),
  ('hard',   'poison_filter_strength', 90),
  ('hard',   'minimax_depth',           3)
ON CONFLICT (difficulty, rule_name) DO NOTHING;

-- ── 3. cosmetic_items — add admin columns ─────────────────────────────────────
ALTER TABLE public.cosmetic_items
  ADD COLUMN IF NOT EXISTS visible  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

-- ── 4. RLS — cosmetic_items admin write ───────────────────────────────────────
CREATE POLICY "cosmetic_items_editor_write" ON public.cosmetic_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

-- ── 5. RLS — achievements admin write ────────────────────────────────────────
CREATE POLICY "achievements_editor_write" ON public.achievements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

-- ── 6. RLS — transactions super_admin read ───────────────────────────────────
CREATE POLICY "transactions_super_admin_read" ON public.transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );
