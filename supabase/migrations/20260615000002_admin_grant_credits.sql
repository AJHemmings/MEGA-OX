CREATE OR REPLACE FUNCTION admin_grant_credits(amount int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- SECURITY DEFINER bypasses admin_roles RLS (avoids recursion — same pattern as admin_grant_xp)
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Delegate to existing atomic credits function rather than duplicating logic
  PERFORM increment_credits(auth.uid(), amount);
END;
$$;
