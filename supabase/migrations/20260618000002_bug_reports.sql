-- ── Table ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  description  TEXT        NOT NULL,
  category     TEXT        NOT NULL CHECK (category IN ('ui', 'game_logic', 'account', 'other')),
  context      JSONB,
  status       TEXT        NOT NULL DEFAULT 'open'
                           CHECK (status IN ('open', 'in_progress', 'resolved', 'dismissed')),
  admin_notes  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── updated_at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_bug_reports_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER bug_reports_updated_at
  BEFORE UPDATE ON public.bug_reports
  FOR EACH ROW EXECUTE FUNCTION set_bug_reports_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- Players can only insert their own rows
CREATE POLICY "bug_reports_insert"
  ON public.bug_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only admins can read
CREATE POLICY "bug_reports_select"
  ON public.bug_reports FOR SELECT
  USING (is_admin());

-- Only admins can update — column-level grant below restricts which columns
CREATE POLICY "bug_reports_update"
  ON public.bug_reports FOR UPDATE
  USING (is_admin());

-- Only admins can delete
CREATE POLICY "bug_reports_delete"
  ON public.bug_reports FOR DELETE
  USING (is_admin());

-- Column-level update grant: restrict all authenticated users to only status and admin_notes.
-- Note: Supabase does not have a separate admin DB role — admins are authenticated users
-- identified by the is_admin() RLS policy. The RLS UPDATE policy already blocks non-admins
-- from updating any row; this column grant additionally prevents admins from writing to
-- user_id/title/description/category/context even if they bypass the ORM.
REVOKE UPDATE ON public.bug_reports FROM authenticated;
GRANT  UPDATE (status, admin_notes) ON public.bug_reports TO authenticated;

-- ── SECURITY DEFINER RPC ──────────────────────────────────────────────────────
-- Runs as postgres role, bypassing RLS, so the COUNT(*) rate-limit check works.
-- Callers are the authenticated role; PUBLIC has no EXECUTE.
CREATE OR REPLACE FUNCTION public.submit_bug_report(
  p_title       TEXT,
  p_description TEXT,
  p_category    TEXT,
  p_context     JSONB
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count INT;
  v_id    UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  -- Guard: profile row must exist (profiles.id = auth.uid() for all signed-up users).
  -- Profile creation happens via handle_new_user trigger on auth.users INSERT.
  -- This guard catches the rare case of a missing profile row rather than surfacing
  -- a FK violation as a generic error.
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  -- Rate limit: max 3 per hour per user
  SELECT COUNT(*) INTO v_count
  FROM public.bug_reports
  WHERE user_id = auth.uid()
    AND created_at > now() - interval '1 hour';

  IF v_count >= 3 THEN
    RAISE EXCEPTION 'rate_limit_exceeded';
  END IF;

  INSERT INTO public.bug_reports (user_id, title, description, category, context)
  VALUES (auth.uid(), p_title, p_description, p_category, p_context)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_bug_report(TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.submit_bug_report(TEXT, TEXT, TEXT, JSONB) TO authenticated;
