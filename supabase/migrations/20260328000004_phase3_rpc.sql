-- supabase/migrations/20260328000004_phase3_rpc.sql
CREATE OR REPLACE FUNCTION public.increment_credits(p_user_id uuid, p_amount integer)
RETURNS void AS $$
BEGIN
  UPDATE public.currency_balance
  SET coins = coins + p_amount
  WHERE player_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
