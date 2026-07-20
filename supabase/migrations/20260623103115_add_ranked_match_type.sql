-- Backfills a migration that was applied directly to the live DB (2026-06-23)
-- without a corresponding file ever being committed. Documented here for
-- schema-drift parity; already applied to the MegaOX project, not re-run.

ALTER TABLE games DROP CONSTRAINT games_match_type_check;
ALTER TABLE games ADD CONSTRAINT games_match_type_check
  CHECK (match_type = ANY (ARRAY['friendly'::text, 'ranked'::text, 'season'::text, 'tournament'::text]));
