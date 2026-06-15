CREATE OR REPLACE FUNCTION admin_grant_xp(amount int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_xp     int;
  new_level  int := 1;
  cumulative int := 0;
  step       int;
BEGIN
  -- Inline admin check — SECURITY DEFINER bypasses admin_roles RLS (avoids recursion)
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE profiles
    SET xp = xp + amount
    WHERE id = auth.uid()
    RETURNING xp INTO new_xp;

  -- Direct port of levelFromXP() in src/lib/progression.ts:
  --   while level < 250 { if totalXP < cumulativeXPToLevel(level+1) break; level++ }
  --   where cumulativeXPToLevel(level+1) = cumulative + ROUND(100 * level^1.5)
  LOOP
    EXIT WHEN new_level >= 250;
    step := ROUND(100.0 * POWER(new_level::numeric, 1.5))::int;
    EXIT WHEN new_xp < cumulative + step;
    cumulative := cumulative + step;
    new_level  := new_level + 1;
  END LOOP;

  UPDATE profiles SET level = new_level WHERE id = auth.uid();
END;
$$;
