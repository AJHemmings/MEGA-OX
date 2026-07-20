-- Admin: edit a scheduled ('upcoming') season's name/start/end date before it
-- goes live. Restricted to 'upcoming' only — editing an active season's dates
-- would fight the daily activate_scheduled_season / rollover_season jobs, and
-- there's no reason to edit a completed one. Same super_admin guard pattern
-- as the other admin_* season RPCs.
CREATE FUNCTION public.admin_update_season(
  p_season_id uuid,
  p_name text DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_current record;
  v_start date;
  v_end date;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_current FROM public.seasons WHERE id = p_season_id AND status = 'upcoming' FOR UPDATE;
  IF v_current.id IS NULL THEN
    RAISE EXCEPTION 'admin_update_season: no scheduled season % found', p_season_id;
  END IF;

  v_start := COALESCE(p_start_date, v_current.start_date);
  v_end   := COALESCE(p_end_date, v_current.end_date);
  IF v_end <= v_start THEN
    RAISE EXCEPTION 'admin_update_season: end date must be after start date';
  END IF;

  UPDATE public.seasons
     SET name       = COALESCE(p_name, name),
         start_date = v_start,
         end_date   = v_end
   WHERE id = p_season_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_update_season(uuid, text, date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_season(uuid, text, date, date) TO authenticated;
