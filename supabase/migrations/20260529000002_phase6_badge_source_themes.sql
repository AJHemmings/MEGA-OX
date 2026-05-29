-- Phase 6 follow-up: badges are earned, not purchased; add theme items
-- Badges: move out of shop catalogue
UPDATE public.cosmetic_items
SET source = 'achievement'
WHERE type = 'badge' AND source = 'shop';

-- Theme items (inventory only — no in-game render in Phase 6)
INSERT INTO public.cosmetic_items (id, name, type, asset_url, price, rarity, source, animated) VALUES
  ('00000000-0000-0006-0006-000000000001', 'Dark Neon', 'theme',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 60%22><rect width=%2260%22 height=%2260%22 fill=%22%23060d1f%22/><rect x=%225%22 y=%225%22 width=%2250%22 height=%2250%22 rx=%224%22 fill=%22none%22 stroke=%22%2300d4aa%22 stroke-width=%221.5%22/><circle cx=%2230%22 cy=%2230%22 r=%228%22 fill=%22%237c4dff%22 opacity=%220.6%22/></svg>',
   400, 'rare', 'shop', false),
  ('00000000-0000-0006-0006-000000000002', 'Classic', 'theme',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 60%22><rect width=%2260%22 height=%2260%22 fill=%22%23f7fafc%22/><rect x=%225%22 y=%225%22 width=%2250%22 height=%2250%22 rx=%224%22 fill=%22none%22 stroke=%22%23cbd5e0%22 stroke-width=%221%22/><circle cx=%2230%22 cy=%2230%22 r=%228%22 fill=%22%234299e1%22 opacity=%220.5%22/></svg>',
   250, 'common', 'shop', false),
  ('00000000-0000-0006-0006-000000000003', 'Ember', 'theme',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 60%22><defs><linearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%221%22><stop offset=%220%22 stop-color=%22%231a0a00%22/><stop offset=%221%22 stop-color=%22%23450a00%22/></linearGradient></defs><rect width=%2260%22 height=%2260%22 fill=%22url(%23g)%22/><rect x=%225%22 y=%225%22 width=%2250%22 height=%2250%22 rx=%224%22 fill=%22none%22 stroke=%22%23f6ad55%22 stroke-width=%221.5%22/></svg>',
   300, 'common', 'shop', false)
ON CONFLICT (id) DO NOTHING;
