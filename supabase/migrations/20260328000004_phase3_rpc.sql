-- supabase/migrations/20260328000004_phase3_rpc.sql
CREATE OR REPLACE FUNCTION public.increment_credits(p_user_id uuid, p_amount integer)
RETURNS void AS $$
BEGIN
  INSERT INTO public.currency_balance (player_id, coins)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (player_id)
  DO UPDATE SET coins = public.currency_balance.coins + EXCLUDED.coins;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
