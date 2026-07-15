-- Phase 10: admins set the active season's reward skin from the dashboard.
-- SECURITY DEFINER + is_admin() guard, same pattern as admin_grant_credits —
-- seasons has no client UPDATE policy by design (all writes via functions).
CREATE OR REPLACE FUNCTION public.admin_set_season_reward(p_season_id uuid, p_skin_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  -- p_skin_id may be NULL to clear the reward (rollover then grants credits only).
  UPDATE public.seasons SET reward_skin_id = p_skin_id WHERE id = p_season_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'admin_set_season_reward: season % not found', p_season_id;
  END IF;
END;
$$;
