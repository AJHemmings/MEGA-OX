-- Review finding (2026-07-17, re-verified + expanded 2026-07-21): ranked-only-
-- via-matchmaking was enforced client-side only. Two live gaps confirmed:
--
-- 1. INSERT: "Players can create friendly games" checked only row ownership
--    (auth.uid() = player_x_id/player_o_id), not match_type — despite its
--    name, a direct PostgREST insert with match_type='ranked' was allowed.
--
-- 2. UPDATE: "Players can update games they are in" has no WITH CHECK at all
--    (ownership-only). match_type is never legitimately changed after insert
--    anywhere in the codebase (client or server) — but nothing stopped a
--    client from creating a normal friendly game, then PATCHing match_type to
--    'ranked' after completion and naming any real user as the opponent.
--    post-game-handler trusts games.match_type and calls apply_ranked_result
--    (service-role-only) whenever it's 'ranked'; apply_ranked_result only
--    guards against self-play, not against a forged match_type. This made it
--    possible to force an ELO change on an arbitrary other player without
--    their consent, not just to fabricate one's own ranked games.
--
-- Fix: (1) restrict the client INSERT policy to match_type = 'friendly';
-- ranked/season/tournament games are created only by join_matchmaking_queue,
-- a SECURITY DEFINER function that inserts as the table owner and so bypasses
-- RLS regardless of this policy's content. (2) make match_type immutable via
-- a BEFORE UPDATE trigger — RLS WITH CHECK can't compare against the old row,
-- so a trigger is the correct primitive here. The trigger fires for every
-- update path (including SECURITY DEFINER functions and service_role), which
-- is fine since none of them ever set match_type.

DROP POLICY "Players can create friendly games" ON public.games;

CREATE POLICY "Players can create friendly games" ON public.games FOR INSERT
  WITH CHECK (
    (auth.uid() = player_x_id OR auth.uid() = player_o_id)
    AND match_type = 'friendly'
  );

CREATE OR REPLACE FUNCTION public.prevent_match_type_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.match_type IS DISTINCT FROM OLD.match_type THEN
    RAISE EXCEPTION 'games.match_type is immutable after creation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS games_match_type_immutable ON public.games;

CREATE TRIGGER games_match_type_immutable
  BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.prevent_match_type_change();
