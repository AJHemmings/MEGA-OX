-- Phase 10 fix: give p_skin_id a DEFAULT NULL so supabase typegen emits it as
-- optional (p_skin_id?: string) — clearing the reward = omitting the arg.
-- Removes the need for any client-side cast (project bans `as any`).
DROP FUNCTION IF EXISTS public.admin_set_season_reward(uuid, uuid);
CREATE FUNCTION public.admin_set_season_reward(p_season_id uuid, p_skin_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.seasons SET reward_skin_id = p_skin_id WHERE id = p_season_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'admin_set_season_reward: season % not found', p_season_id;
  END IF;
END;
$$;
