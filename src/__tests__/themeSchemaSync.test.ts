import fs from 'fs';
import path from 'path';

// The Phase B1 schema migration widens two closed CHECK lists. Nothing else
// would catch a later migration narrowing them again, or a new cosmetic type
// being added in TypeScript without a matching constraint widening.
const MIGRATIONS = path.resolve(__dirname, '../../supabase/migrations');

function migrationsContaining(pattern: RegExp): string[] {
  return fs.readdirSync(MIGRATIONS)
    .filter(f => f.endsWith('.sql'))
    .filter(f => pattern.test(fs.readFileSync(path.join(MIGRATIONS, f), 'utf8')))
    .sort(); // timestamp-prefixed filenames sort chronologically
}

function latestMatching(pattern: RegExp): string {
  const files = migrationsContaining(pattern);
  if (files.length === 0) throw new Error(`No migration matches ${pattern}`);
  return fs.readFileSync(path.join(MIGRATIONS, files[files.length - 1]), 'utf8');
}

describe('theme Phase B1 schema', () => {
  test('cosmetic_items_type_check allows the four new theme component types', () => {
    const sql = latestMatching(/cosmetic_items_type_check/);
    const m = sql.match(/cosmetic_items_type_check[\s\S]*?CHECK \(type IN \(([^)]*)\)\)/);
    expect(m).not.toBeNull();
    const types = m![1].split(',').map(s => s.trim().replace(/'/g, ''));
    for (const t of ['background', 'cursor', 'sound_pack', 'pill_style']) {
      expect(types).toContain(t);
    }
    // pre-existing types must survive the widening
    for (const t of ['marker', 'board', 'theme', 'avatar', 'badge', 'banner', 'emoji']) {
      expect(types).toContain(t);
    }
  });

  test('player_inventory acquisition_source allows theme_bundle', () => {
    const sql = latestMatching(/player_inventory_acquisition_source_check/);
    const m = sql.match(/acquisition_source IN \(([^)]*)\)/);
    expect(m).not.toBeNull();
    const sources = m![1].split(',').map(s => s.trim().replace(/'/g, ''));
    expect(sources).toContain('theme_bundle');
    for (const s of ['purchased', 'tournament', 'achievement', 'default']) {
      expect(sources).toContain(s);
    }
  });

  test('the four new profiles slot columns exist with FKs to cosmetic_items', () => {
    const sql = latestMatching(/active_background_id/);
    for (const col of ['active_background_id', 'active_cursor_id',
                       'active_sound_pack_id', 'active_pill_style_id']) {
      expect(sql).toMatch(new RegExp(`${col}\\s+uuid`, 'i'));
      expect(sql).toMatch(new RegExp(`FOREIGN KEY \\(${col}\\)[\\s\\S]{0,80}cosmetic_items`, 'i'));
    }
  });
});
