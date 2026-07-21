-- Review finding (2026-07-17, resolved 2026-07-21): ranked_enabled=false
-- stranded any already-searching ranked queue rows for up to 10 minutes
-- (join_matchmaking_queue's kill-switch check only blocks NEW ranked joins;
-- existing 'searching' rows just sat there until the 10-minute created_at
-- window aged them out of the matching query). A prior comment in
-- join_matchmaking_queue called this "accepted" — but the finding was never
-- closed, so treat it as still open: clear those rows immediately when the
-- switch flips off instead of waiting for the passive age-out.
CREATE OR REPLACE FUNCTION public.admin_set_config(p_key text, p_value jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  INSERT INTO public.app_config (key, value, updated_at)
  VALUES (p_key, p_value, now())
  ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now();

  IF p_key = 'ranked_enabled' AND p_value = 'false'::jsonb THEN
    DELETE FROM public.matchmaking_queue
    WHERE match_type = 'ranked' AND status = 'searching';
  END IF;
END;
$$;
