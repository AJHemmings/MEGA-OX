-- Phase 6: purchase_item RPC + paid cosmetic catalogue
-- transactions table + RLS already exist from initial schema.
-- user_skins/user_equipped_skins RLS already exists from Phase 2.

-- -- 1. purchase_item RPC ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.purchase_item(p_item_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id UUID;
  v_price     INTEGER;
  v_coins     INTEGER;
  v_owned     BOOLEAN;
BEGIN
  v_player_id := auth.uid();
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT price INTO v_price FROM public.cosmetic_items WHERE id = p_item_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'item_not_found');
  END IF;
  IF v_price IS NULL OR v_price = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'item_not_purchasable');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.player_inventory
    WHERE player_id = v_player_id AND item_id = p_item_id
  ) INTO v_owned;
  IF v_owned THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_owned');
  END IF;

  SELECT coins INTO v_coins
  FROM public.currency_balance
  WHERE player_id = v_player_id
  FOR UPDATE;

  IF v_coins IS NULL OR v_coins < v_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_credits');
  END IF;

  UPDATE public.currency_balance
  SET coins = coins - v_price
  WHERE player_id = v_player_id;

  INSERT INTO public.player_inventory (player_id, item_id, acquisition_source)
  VALUES (v_player_id, p_item_id, 'purchased');

  INSERT INTO public.transactions (player_id, type, amount, item_id)
  VALUES (v_player_id, 'purchase', v_price, p_item_id);

  RETURN jsonb_build_object('success', true, 'new_balance', v_coins - v_price);
END;
$$;

-- -- 2. Paid cosmetic catalogue (13 items) -----------------------------------
INSERT INTO public.cosmetic_items (id, name, type, asset_url, price, rarity, source, animated) VALUES
  ('00000000-0000-0006-0001-000000000001', 'Neon Teal', 'avatar',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><circle cx=%2220%22 cy=%2220%22 r=%2220%22 fill=%22%2300d4aa%22/><text x=%2220%22 y=%2226%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2214%22 font-family=%22sans-serif%22>OX</text></svg>',
   200, 'common', 'shop', false),
  ('00000000-0000-0006-0001-000000000002', 'Crimson', 'avatar',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><circle cx=%2220%22 cy=%2220%22 r=%2220%22 fill=%22%23e53e3e%22/><text x=%2220%22 y=%2226%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2214%22 font-family=%22sans-serif%22>OX</text></svg>',
   200, 'common', 'shop', false),
  ('00000000-0000-0006-0001-000000000003', 'Gold', 'avatar',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><circle cx=%2220%22 cy=%2220%22 r=%2220%22 fill=%22%23f6ad55%22/><text x=%2220%22 y=%2226%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2214%22 font-family=%22sans-serif%22>OX</text></svg>',
   500, 'rare', 'shop', false),
  ('00000000-0000-0006-0002-000000000001', 'Veteran', 'badge',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22><polygon points=%2210,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7%22 fill=%22%23c05621%22/></svg>',
   150, 'common', 'shop', false),
  ('00000000-0000-0006-0002-000000000002', 'Champion', 'badge',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22><polygon points=%2210,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7%22 fill=%22%234299e1%22/></svg>',
   300, 'common', 'shop', false),
  ('00000000-0000-0006-0002-000000000003', 'Legend', 'badge',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22><polygon points=%2210,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7%22 fill=%22%23d69e2e%22/></svg>',
   500, 'rare', 'shop', false),
  ('00000000-0000-0006-0003-000000000001', 'Sunset', 'banner',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 60%22><defs><linearGradient id=%22g%22 x1=%220%22 x2=%221%22><stop offset=%220%22 stop-color=%22%23f6ad55%22/><stop offset=%221%22 stop-color=%22%23e53e3e%22/></linearGradient></defs><rect width=%22300%22 height=%2260%22 fill=%22url(%23g)%22/></svg>',
   200, 'common', 'shop', false),
  ('00000000-0000-0006-0003-000000000002', 'Forest', 'banner',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 60%22><defs><linearGradient id=%22g%22 x1=%220%22 x2=%221%22><stop offset=%220%22 stop-color=%22%2338a169%22/><stop offset=%221%22 stop-color=%22%232d6a4f%22/></linearGradient></defs><rect width=%22300%22 height=%2260%22 fill=%22url(%23g)%22/></svg>',
   200, 'common', 'shop', false),
  ('00000000-0000-0006-0003-000000000003', 'Void', 'banner',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 60%22><defs><linearGradient id=%22g%22 x1=%220%22 x2=%221%22><stop offset=%220%22 stop-color=%22%234a1d96%22/><stop offset=%221%22 stop-color=%22%23060d1f%22/></linearGradient></defs><rect width=%22300%22 height=%2260%22 fill=%22url(%23g)%22/></svg>',
   350, 'common', 'shop', false),
  ('00000000-0000-0006-0004-000000000001', 'Neon Grid', 'board',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 60%22><rect width=%2260%22 height=%2260%22 fill=%22%23060d1f%22/><line x1=%2220%22 y1=%220%22 x2=%2220%22 y2=%2260%22 stroke=%22%2300d4aa%22 stroke-width=%221.5%22/><line x1=%2240%22 y1=%220%22 x2=%2240%22 y2=%2260%22 stroke=%22%2300d4aa%22 stroke-width=%221.5%22/><line x1=%220%22 y1=%2220%22 x2=%2260%22 y2=%2220%22 stroke=%22%2300d4aa%22 stroke-width=%221.5%22/><line x1=%220%22 y1=%2240%22 x2=%2260%22 y2=%2240%22 stroke=%22%2300d4aa%22 stroke-width=%221.5%22/></svg>',
   300, 'common', 'shop', false),
  ('00000000-0000-0006-0004-000000000002', 'Minimal', 'board',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 60%22><rect width=%2260%22 height=%2260%22 fill=%22%23f7fafc%22/><line x1=%2220%22 y1=%225%22 x2=%2220%22 y2=%2255%22 stroke=%22%23cbd5e0%22 stroke-width=%221%22/><line x1=%2240%22 y1=%225%22 x2=%2240%22 y2=%2255%22 stroke=%22%23cbd5e0%22 stroke-width=%221%22/><line x1=%225%22 y1=%2220%22 x2=%2255%22 y2=%2220%22 stroke=%22%23cbd5e0%22 stroke-width=%221%22/><line x1=%225%22 y1=%2240%22 x2=%2255%22 y2=%2240%22 stroke=%22%23cbd5e0%22 stroke-width=%221%22/></svg>',
   250, 'common', 'shop', false),
  ('00000000-0000-0006-0005-000000000001', 'Neon Set', 'marker',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 60%22><rect width=%2260%22 height=%2260%22 fill=%22%23060d1f%22/><text x=%2215%22 y=%2238%22 font-size=%2224%22 font-family=%22sans-serif%22 font-weight=%22900%22 fill=%22%2300d4aa%22>X</text><text x=%2236%22 y=%2238%22 font-size=%2224%22 font-family=%22sans-serif%22 font-weight=%22900%22 fill=%22%237c4dff%22>O</text></svg>',
   350, 'common', 'shop', false),
  ('00000000-0000-0006-0005-000000000002', 'Pixel Set', 'marker',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 60%22><rect width=%2260%22 height=%2260%22 fill=%22%231a2332%22/><text x=%2215%22 y=%2238%22 font-size=%2224%22 font-family=%22monospace%22 font-weight=%22900%22 fill=%22%23f6ad55%22>X</text><text x=%2236%22 y=%2238%22 font-size=%2224%22 font-family=%22monospace%22 font-weight=%22900%22 fill=%22%23fc8181%22>O</text></svg>',
   300, 'common', 'shop', false)
ON CONFLICT (id) DO NOTHING;
