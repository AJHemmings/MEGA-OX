-- Admin: create a new season from scratch. The only existing season-lifecycle
-- action is admin_end_season → rollover_season, which requires an existing
-- active season to roll from (RAISEs "no active season" otherwise). If the
-- app ever has zero active seasons (fresh setup, or an active season ended
-- without a successor for any reason), there was previously no admin path to
-- start one — same super_admin guard pattern as admin_end_season/admin_set_config.

CREATE FUNCTION public.admin_create_season(p_name text DEFAULT NULL, p_end_date date DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_next_number integer;
  v_end date;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF EXISTS (SELECT 1 FROM public.seasons WHERE status = 'active') THEN
    RAISE EXCEPTION 'admin_create_season: a season is already active — end it first';
  END IF;

  SELECT COALESCE(MAX(number), 0) + 1 INTO v_next_number FROM public.seasons;
  v_end := COALESCE(p_end_date, (date_trunc('month', now()) + interval '1 month')::date);

  INSERT INTO public.seasons (name, number, start_date, end_date, status)
  VALUES (COALESCE(p_name, 'Season ' || v_next_number), v_next_number, now()::date, v_end, 'active');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_create_season(text, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_season(text, date) TO authenticated;
