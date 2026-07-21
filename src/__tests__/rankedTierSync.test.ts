import fs from 'fs';
import path from 'path';
import { TIERS } from '../lib/ranked';

// Tier thresholds live in two runtimes that can't share a literal: SQL
// (public.tier_for_rating, single source of truth for rollover_season's
// credit/skin rewards) and TIERS here (client display). This test reads the
// thresholds back out of the latest migration that defines tier_for_rating
// and fails if they ever drift from TIERS, since nothing else would catch
// that at build time.
function latestTierForRatingMigration(): string {
  const dir = path.resolve(__dirname, '../../supabase/migrations');
  const candidates = fs.readdirSync(dir)
    .filter(f => f.endsWith('.sql'))
    .filter(f => /tier_for_rating/.test(fs.readFileSync(path.join(dir, f), 'utf8')))
    .sort(); // timestamp-prefixed filenames sort chronologically
  if (candidates.length === 0) {
    throw new Error('No migration defines public.tier_for_rating — did it get renamed or removed?');
  }
  return fs.readFileSync(path.join(dir, candidates[candidates.length - 1]), 'utf8');
}

function parseSqlThresholds(sql: string): Record<string, number> {
  const match = sql.match(/CREATE (?:OR REPLACE )?FUNCTION public\.tier_for_rating[\s\S]*?\$\$;/);
  if (!match) throw new Error('Could not isolate tier_for_rating function body in migration SQL');
  const body = match[0];
  const thresholds: Record<string, number> = {};
  for (const m of body.matchAll(/WHEN p_rating >=\s*(\d+)\s+THEN\s+'(\w+)'/g)) {
    thresholds[m[2]] = Number(m[1]);
  }
  return thresholds;
}

describe('ranked tier thresholds stay in sync with SQL', () => {
  const sqlThresholds = parseSqlThresholds(latestTierForRatingMigration());

  it('found all four non-Bronze thresholds in the SQL migration', () => {
    expect(Object.keys(sqlThresholds).sort()).toEqual(['Diamond', 'Gold', 'Platinum', 'Silver'].sort());
  });

  it.each(TIERS.filter(t => Number.isFinite(t.min)).map(t => [t.tier, t.min] as const))(
    '%s: TS min (%i) matches SQL threshold',
    (tier, min) => {
      expect(sqlThresholds[tier]).toBe(min);
    }
  );
});
