-- Phase 10 hardening: REVOKE ... FROM PUBLIC is NOT sufficient on Supabase —
-- project default privileges grant EXECUTE on new functions to anon and
-- authenticated EXPLICITLY, separate from the implicit PUBLIC grant. Advisor
-- (0028) caught rollover_season() still anon-callable via /rest/v1/rpc.
-- apply_ranked_result got this right (revokes all three roles); this brings
-- rollover_season in line. pg_cron runs as postgres, unaffected.
REVOKE EXECUTE ON FUNCTION public.rollover_season() FROM PUBLIC, anon, authenticated;
