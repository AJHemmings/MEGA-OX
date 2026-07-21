-- Review finding (2026-07-17, most severe, previously unaddressed): admin_end_season
-- took no season identifier, so a stale admin tab — showing Season N as active
-- because that's what it loaded, while the DB has since moved on to Season N+1
-- via the monthly cron or another admin action — would silently force-end
-- whatever season happens to be active NOW, not the one the admin actually
-- saw and confirmed. The client already knows the season number it's
-- confirming against (it's typed into the "type the season number" input);
-- now the server verifies it matches before touching anything.
DROP FUNCTION public.admin_end_season();

CREATE FUNCTION public.admin_end_season(p_expected_number integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_active_number integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT number INTO v_active_number FROM public.seasons WHERE status = 'active';

  IF v_active_number IS NULL THEN
    RAISE EXCEPTION 'admin_end_season: no active season';
  END IF;

  IF v_active_number IS DISTINCT FROM p_expected_number THEN
    RAISE EXCEPTION 'admin_end_season: active season changed since this page loaded (expected Season %, currently Season %) — refresh and try again', p_expected_number, v_active_number;
  END IF;

  PERFORM public.rollover_season(p_force := true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_end_season(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_end_season(integer) TO authenticated;
