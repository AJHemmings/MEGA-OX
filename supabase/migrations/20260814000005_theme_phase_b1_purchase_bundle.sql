-- Theme Phase B1: buying a theme grants its member items (spec §5).
-- Equipping a theme writes member IDs into the player's slot columns, so the
-- player must own them. Full redeclaration of the function from
-- 20260529000001_phase6_shop.sql; the ONLY change is the bundle-grant INSERT
-- marked below.

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
  v_type      TEXT;
  v_members   JSONB;
BEGIN
  v_player_id := auth.uid();
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT price, type, config->'members'
    INTO v_price, v_type, v_members
  FROM public.cosmetic_items WHERE id = p_item_id;
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

  -- >>> Phase B1 addition: a theme purchase also grants its members. <<<
  -- Skips ids that don't resolve to a real item, so a stale manifest can't
  -- break a purchase with an FK violation.
  IF v_type = 'theme' AND v_members IS NOT NULL
     AND jsonb_typeof(v_members) = 'object' THEN
    INSERT INTO public.player_inventory (player_id, item_id, acquisition_source)
    SELECT v_player_id, (m.value #>> '{}')::uuid, 'theme_bundle'
    FROM jsonb_each(v_members) AS m
    WHERE EXISTS (
      SELECT 1 FROM public.cosmetic_items ci
      WHERE ci.id = (m.value #>> '{}')::uuid
    )
    ON CONFLICT (player_id, item_id) DO NOTHING;
  END IF;
  -- >>> end Phase B1 addition <<<

  INSERT INTO public.transactions (player_id, type, amount, item_id)
  VALUES (v_player_id, 'purchase', v_price, p_item_id);

  RETURN jsonb_build_object('success', true, 'new_balance', v_coins - v_price);
END;
$$;
