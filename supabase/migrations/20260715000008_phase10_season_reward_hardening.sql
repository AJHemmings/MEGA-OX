-- Phase 10 hardening (Task 11 review): the /admin/seasons UI is gated
-- super_admin, so the RPC guard must match — is_admin() also passes editors.
-- Also restrict updates to the active season (the UI only offers the picker
-- there) and add the standard execute grants (precedent: submit_bug_report,
-- apply_ranked_result, rollover_season).
CREATE OR REPLACE FUNCTION public.admin_set_season_reward(p_season_id uuid, p_skin_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.seasons SET reward_skin_id = p_skin_id
   WHERE id = p_season_id AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'admin_set_season_reward: active season % not found', p_season_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_season_reward(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_season_reward(uuid, uuid) TO authenticated;
