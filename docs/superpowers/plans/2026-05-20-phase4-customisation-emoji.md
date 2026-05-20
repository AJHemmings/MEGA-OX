# Phase 4 — Profile Customisation + Emoji Communication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let players equip cosmetic items (avatar, badge, banner) from a selectable set on their profile, and send emoji reactions to opponents during online games.

**Architecture:** A shared `cosmetic_items` catalogue + `player_inventory` ownership table (both already in DB) backs all cosmetics. Profiles store equipped item IDs as FK columns. Emoji communication uses broadcast on the existing Supabase Realtime channel in `useOnlineGame` — ephemeral, no persistence. All Phase 4 items are seeded with `price = 0`; the purchase flow is Phase 6.

**Tech Stack:** React, TypeScript, Supabase (postgres_changes + broadcast), inline SVG data URIs for placeholder assets.

---

## Codebase orientation

Before starting, understand these files:

| File | Relevance |
|---|---|
| `src/lib/database.types.ts` | DB type definitions — update after every migration |
| `src/contexts/AuthContext.tsx` | `user.id` is the player's UUID throughout |
| `src/hooks/useProgression.ts` | Pattern for Supabase hooks — follow this structure |
| `src/hooks/useOnlineGame.ts` | Owns the Supabase Realtime channel — emoji events go here |
| `src/components/game/OnlineGameView.tsx` | Renders the online game — emoji UI wired here |
| `src/components/profile/ProfilePage.tsx` | Profile display — update to show equipped cosmetics |
| `src/App.tsx` | All routes defined here |
| `supabase/migrations/20260318000001_skins.sql` | Shows the seed/RLS pattern to follow |

---

## File map

**Create:**
- `supabase/migrations/20260520000001_phase4_schema.sql` — loadout columns, seed items, inventory grants, RLS
- `src/hooks/useInventory.ts` — fetch owned cosmetic items for a player, filtered by type
- `src/hooks/useLoadout.ts` — fetch + update equipped cosmetics (avatar/badge/banner) on profiles
- `src/components/profile/CustomisePage.tsx` — UI to browse owned items and equip them
- `src/components/game/EmojiPanel.tsx` — in-game emoji selector (shows player's owned emojis)
- `src/components/game/EmojiBubble.tsx` — floating bubble rendered near a player's side of the board

**Modify:**
- `src/lib/database.types.ts` — add `active_avatar_id`, `active_badge_id`, `active_banner_id` to profiles Row/Insert/Update
- `src/App.tsx` — add `/customise` route
- `src/components/profile/ProfilePage.tsx` — display equipped avatar/badge/banner; update "Edit Profile" button to `/customise`
- `src/hooks/useOnlineGame.ts` — add `sendEmoji(emoji)` + `myEmoji`/`opponentEmoji` state
- `src/components/game/OnlineGameView.tsx` — render EmojiPanel + EmojiBubbles

---

## Subsystem A: DB Foundation + Profile Customisation

---

### Task 1: DB migration — Phase 4 schema

**Files:**
- Create: `supabase/migrations/20260520000001_phase4_schema.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 20260520000001_phase4_schema.sql
-- Phase 4: add avatar/badge/banner loadout columns to profiles,
-- seed placeholder cosmetic items, grant to all existing players.

-- 1. Add loadout columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_avatar_id uuid REFERENCES public.cosmetic_items(id),
  ADD COLUMN IF NOT EXISTS active_badge_id  uuid REFERENCES public.cosmetic_items(id),
  ADD COLUMN IF NOT EXISTS active_banner_id uuid REFERENCES public.cosmetic_items(id);

-- 2. Expand CHECK constraints to allow Phase 4 types/sources
-- (original constraints only allowed 'marker','board','theme' and 'shop','tournament','achievement')
ALTER TABLE public.cosmetic_items
  DROP CONSTRAINT IF EXISTS cosmetic_items_type_check,
  DROP CONSTRAINT IF EXISTS cosmetic_items_source_check;

ALTER TABLE public.cosmetic_items
  ADD CONSTRAINT cosmetic_items_type_check
    CHECK (type IN ('marker', 'board', 'theme', 'avatar', 'badge', 'banner', 'emoji')),
  ADD CONSTRAINT cosmetic_items_source_check
    CHECK (source IN ('shop', 'tournament', 'achievement', 'default'));

ALTER TABLE public.player_inventory
  DROP CONSTRAINT IF EXISTS player_inventory_acquisition_source_check;

ALTER TABLE public.player_inventory
  ADD CONSTRAINT player_inventory_acquisition_source_check
    CHECK (acquisition_source IN ('purchased', 'tournament', 'achievement', 'default'));

-- 3. Seed Phase 4 cosmetic items (all free, price = 0)
INSERT INTO public.cosmetic_items (id, name, type, asset_url, price, rarity, source, animated) VALUES
  -- Avatars
  ('00000000-0000-0004-0001-000000000001', 'Classic Blue',   'avatar',  'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><circle cx=%2220%22 cy=%2220%22 r=%2220%22 fill=%22%234299e1%22/><text x=%2220%22 y=%2226%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2214%22 font-family=%22sans-serif%22>OX</text></svg>', 0, 'common', 'default', false),
  ('00000000-0000-0004-0001-000000000002', 'Classic Orange', 'avatar',  'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><circle cx=%2220%22 cy=%2220%22 r=%2220%22 fill=%22%23ed8936%22/><text x=%2220%22 y=%2226%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2214%22 font-family=%22sans-serif%22>OX</text></svg>', 0, 'common', 'default', false),
  -- Badges
  ('00000000-0000-0004-0002-000000000001', 'Newcomer',       'badge',   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22><polygon points=%2210,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7%22 fill=%22%23a0aec0%22/></svg>', 0, 'common', 'default', false),
  ('00000000-0000-0004-0002-000000000002', 'Player',         'badge',   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22><polygon points=%2210,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7%22 fill=%22%2348bb78%22/></svg>', 0, 'common', 'default', false),
  -- Banners
  ('00000000-0000-0004-0003-000000000001', 'Night Sky',      'banner',  'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 60%22><defs><linearGradient id=%22g%22 x1=%220%22 x2=%221%22><stop offset=%220%22 stop-color=%22%231a2332%22/><stop offset=%221%22 stop-color=%22%232d3748%22/></linearGradient></defs><rect width=%22300%22 height=%2260%22 fill=%22url(%23g)%22/></svg>', 0, 'common', 'default', false),
  ('00000000-0000-0004-0003-000000000002', 'Ocean',          'banner',  'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 60%22><defs><linearGradient id=%22g%22 x1=%220%22 x2=%221%22><stop offset=%220%22 stop-color=%22%232b6cb0%22/><stop offset=%221%22 stop-color=%22%2300d4aa%22/></linearGradient></defs><rect width=%22300%22 height=%2260%22 fill=%22url(%23g)%22/></svg>', 0, 'common', 'default', false),
  -- Emojis
  ('00000000-0000-0004-0004-000000000001', 'Thumbs Up',      'emoji',   '👍', 0, 'common', 'default', false),
  ('00000000-0000-0004-0004-000000000002', 'Fire',           'emoji',   '🔥', 0, 'common', 'default', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Grant all Phase 4 items to every existing player
INSERT INTO public.player_inventory (player_id, item_id, acquisition_source)
SELECT p.id, i.id, 'default'
FROM public.profiles p
CROSS JOIN public.cosmetic_items i
WHERE i.source = 'default'
  AND i.type IN ('avatar', 'badge', 'banner', 'emoji')
ON CONFLICT DO NOTHING;

-- 5. Set default equipped items on all existing profiles
UPDATE public.profiles
SET
  active_avatar_id = COALESCE(active_avatar_id, '00000000-0000-0004-0001-000000000001'),
  active_badge_id  = COALESCE(active_badge_id,  '00000000-0000-0004-0002-000000000001'),
  active_banner_id = COALESCE(active_banner_id, '00000000-0000-0004-0003-000000000001')
WHERE active_avatar_id IS NULL
   OR active_badge_id  IS NULL
   OR active_banner_id IS NULL;

-- 6. RLS: allow users to update their own loadout columns
-- (profiles table should already allow self-update; this ensures the new columns are covered)
-- If an UPDATE policy doesn't exist yet, create one:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use the Supabase MCP tool to run the migration against the project (`qioxtkcjtvvkzcoupdfk`). Verify it completes without error. If "column already exists" errors appear on the `ADD COLUMN` lines, the columns were added manually — that is fine; the `IF NOT EXISTS` guards handle it.

- [ ] **Step 3: Verify in DB**

Run these queries via Supabase MCP to confirm:
- `SELECT id, name, type FROM cosmetic_items WHERE type IN ('avatar','badge','banner','emoji') ORDER BY type, name` → should return 8 rows
- `SELECT COUNT(*) FROM player_inventory WHERE item_id LIKE '00000000-0000-0004-%'` → should equal (number of players × 8)
- `SELECT active_avatar_id, active_badge_id, active_banner_id FROM profiles LIMIT 3` → should all be non-null

- [ ] **Step 4: Update `database.types.ts`**

Add `active_avatar_id`, `active_badge_id`, `active_banner_id` to the `profiles` Row, Insert, and Update types in `src/lib/database.types.ts`:

```typescript
// In profiles.Row (after active_theme_id):
active_avatar_id: string | null
active_badge_id:  string | null
active_banner_id: string | null

// In profiles.Insert:
active_avatar_id?: string | null
active_badge_id?:  string | null
active_banner_id?: string | null

// In profiles.Update:
active_avatar_id?: string | null
active_badge_id?:  string | null
active_banner_id?: string | null
```

Also add the FK relationships for the three new columns (pattern: copy the `fk_active_board` relationship, change column name and FK name).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260520000001_phase4_schema.sql src/lib/database.types.ts
git commit -m "feat(db): Phase 4 schema — avatar/badge/banner loadout columns, cosmetic seed, inventory grants"
```

---

### Task 2: `useInventory` hook

**Files:**
- Create: `src/hooks/useInventory.ts`

This hook fetches all cosmetic items owned by a player, joined with the item details. Optionally filtered by type.

- [ ] **Step 1: Write the hook**

```typescript
// src/hooks/useInventory.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface OwnedItem {
  item_id: string;
  name: string;
  type: string;
  asset_url: string | null;
  rarity: string;
  acquired_at: string | null;
}

export function useInventory(playerId: string | undefined, type?: string) {
  const [items, setItems] = useState<OwnedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) { setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from('player_inventory')
        .select('item_id, acquired_at, cosmetic_items(name, type, asset_url, rarity)')
        .eq('player_id', playerId);

      // Filter by type client-side — PostgREST does not support .eq() on embedded resource columns
      const mapped: OwnedItem[] = (data ?? [])
        .filter((row: any) => row.cosmetic_items !== null)
        .filter((row: any) => !type || row.cosmetic_items.type === type)
        .map((row: any) => ({
          item_id:     row.item_id,
          name:        row.cosmetic_items.name,
          type:        row.cosmetic_items.type,
          asset_url:   row.cosmetic_items.asset_url,
          rarity:      row.cosmetic_items.rarity,
          acquired_at: row.acquired_at,
        }));

      setItems(mapped);
      setLoading(false);
    };

    fetch();
  }, [playerId, type]);

  return { items, loading };
}
```

**Note on the Supabase join:** `cosmetic_items(...)` uses the foreign key on `player_inventory.item_id`. This is a Supabase PostgREST embedded resource query — it returns the related row inline. The `.filter()` call drops any rows where the join returned null (shouldn't happen in practice, but safe).

- [ ] **Step 2: Verify the join shape via Supabase MCP**

Run this query to confirm the join returns data in the expected shape:
```sql
SELECT pi.player_id, pi.item_id, pi.acquisition_source,
       ci.name, ci.type, ci.asset_url
FROM player_inventory pi
JOIN cosmetic_items ci ON ci.id = pi.item_id
WHERE ci.type IN ('avatar','badge','banner','emoji')
LIMIT 10;
```
Expected: rows with `name`, `type`, `asset_url` populated. If this returns 0 rows, the migration's inventory grant did not run — re-check Step 2.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useInventory.ts
git commit -m "feat: useInventory hook — fetch player-owned cosmetic items by type"
```

---

### Task 3: `useLoadout` hook

**Files:**
- Create: `src/hooks/useLoadout.ts`

Reads and updates a player's equipped cosmetics (avatar/badge/banner) from the `profiles` table.

- [ ] **Step 1: Write the hook**

```typescript
// src/hooks/useLoadout.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Loadout {
  active_avatar_id: string | null;
  active_badge_id:  string | null;
  active_banner_id: string | null;
}

export function useLoadout(playerId: string | undefined) {
  const [loadout, setLoadout] = useState<Loadout>({
    active_avatar_id: null,
    active_badge_id:  null,
    active_banner_id: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) { setLoading(false); return; }

    supabase
      .from('profiles')
      .select('active_avatar_id, active_badge_id, active_banner_id')
      .eq('id', playerId)
      .single()
      .then(({ data }) => {
        if (data) setLoadout(data);
        setLoading(false);
      });
  }, [playerId]);

  const equip = useCallback(async (
    slot: 'active_avatar_id' | 'active_badge_id' | 'active_banner_id',
    itemId: string
  ) => {
    if (!playerId) return;
    const prev = loadout[slot];
    setLoadout(l => ({ ...l, [slot]: itemId })); // optimistic
    const { error } = await supabase
      .from('profiles')
      .update({ [slot]: itemId })
      .eq('id', playerId);
    if (error) {
      setLoadout(l => ({ ...l, [slot]: prev })); // roll back on failure
      console.error('equip failed:', error.message);
    }
  }, [playerId, loadout]);

  return { loadout, loading, equip };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useLoadout.ts
git commit -m "feat: useLoadout hook — read and update equipped cosmetics on profiles"
```

---

### Task 4: `CustomisePage` component

**Files:**
- Create: `src/components/profile/CustomisePage.tsx`

A page at `/customise` showing four tabs: Avatar, Badge, Banner, Emoji. Each tab shows a grid of owned items; clicking one equips it immediately (for avatar/badge/banner) or marks it as the active emoji (displayed but not persisted — emojis are always available from inventory, no "equip" concept).

- [ ] **Step 1: Write the component**

```typescript
// src/components/profile/CustomisePage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInventory, OwnedItem } from '../../hooks/useInventory';
import { useLoadout } from '../../hooks/useLoadout';

type Tab = 'avatar' | 'badge' | 'banner' | 'emoji';

const TABS: { key: Tab; label: string }[] = [
  { key: 'avatar', label: 'Avatar' },
  { key: 'badge',  label: 'Badge'  },
  { key: 'banner', label: 'Banner' },
  { key: 'emoji',  label: 'Emoji'  },
];

const SLOT_MAP: Record<Exclude<Tab, 'emoji'>, 'active_avatar_id' | 'active_badge_id' | 'active_banner_id'> = {
  avatar: 'active_avatar_id',
  badge:  'active_badge_id',
  banner: 'active_banner_id',
};

const CustomisePage: React.FC = () => {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const [tab, setTab] = useState<Tab>('avatar');

  const { items, loading } = useInventory(user?.id);
  const { loadout, equip } = useLoadout(user?.id);

  const tabItems = items.filter(i => i.type === tab);

  const isEquipped = (item: OwnedItem): boolean => {
    if (tab === 'emoji') return false;
    return loadout[SLOT_MAP[tab]] === item.item_id;
  };

  const handleSelect = (item: OwnedItem) => {
    if (tab === 'emoji') return; // emojis have no loadout slot
    equip(SLOT_MAP[tab], item.item_id);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a2332', color: '#fff', padding: '24px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <button onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: '20px' }}>←</button>
          <h1 style={{ margin: 0, fontSize: '22px' }}>Customise</h1>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: tab === t.key ? 700 : 400,
                background: tab === t.key ? '#00d4aa' : '#2a3441',
                color: tab === t.key ? '#1a2332' : '#a0aec0',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Item grid — emoji tab shows owned emojis for discovery only; selection happens in-game via EmojiPanel */}
        {loading ? (
          <div style={{ color: '#a0aec0', textAlign: 'center', padding: '40px 0' }}>Loading...</div>
        ) : tabItems.length === 0 ? (
          <div style={{ color: '#4a5568', textAlign: 'center', padding: '40px 0' }}>No items yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {tabItems.map(item => (
              <button key={item.item_id} onClick={() => handleSelect(item)}
                style={{
                  background: isEquipped(item) ? '#1a3a3a' : '#2a3441',
                  border: `2px solid ${isEquipped(item) ? '#00d4aa' : '#4a5568'}`,
                  borderRadius: '10px', padding: '12px 8px', cursor: tab === 'emoji' ? 'default' : 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                }}>
                <ItemPreview item={item} />
                <span style={{ fontSize: '11px', color: '#a0aec0', textAlign: 'center' }}>{item.name}</span>
                {isEquipped(item) && (
                  <span style={{ fontSize: '10px', color: '#00d4aa', fontWeight: 700 }}>Equipped</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ItemPreview: React.FC<{ item: OwnedItem }> = ({ item }) => {
  if (item.type === 'emoji') {
    return <span style={{ fontSize: '28px' }}>{item.asset_url}</span>;
  }
  if (item.type === 'banner') {
    return (
      <div style={{ width: '100%', height: '30px', borderRadius: '4px', overflow: 'hidden' }}>
        <img src={item.asset_url ?? ''} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }
  // avatar, badge
  const size = item.type === 'avatar' ? 48 : 32;
  return (
    <img src={item.asset_url ?? ''} alt={item.name}
      style={{ width: size, height: size, borderRadius: item.type === 'avatar' ? '50%' : '4px' }} />
  );
};

export default CustomisePage;
```

- [ ] **Step 2: Add the route to `App.tsx`**

Find the routes section in `src/App.tsx`. Add `/customise` inside the `ProtectedRoute` wrapper, following the same pattern as `/achievements`:

```tsx
import CustomisePage from './components/profile/CustomisePage';
// ...
<Route path="/customise" element={<CustomisePage />} />
```

- [ ] **Step 3: Update "Edit Profile" button in `ProfilePage.tsx`**

In `src/components/profile/ProfilePage.tsx`, line 137, replace the full button element — keep all existing styles, only change the click target and label:

```tsx
// Change (keep the style prop exactly as-is):
<button onClick={() => navigate('/settings')}
  style={{ marginLeft: 'auto', background: '#2a3441', border: '1px solid #4a5568', color: '#a0aec0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
  Edit Profile
</button>
// To:
<button onClick={() => navigate('/customise')}
  style={{ marginLeft: 'auto', background: '#2a3441', border: '1px solid #4a5568', color: '#a0aec0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
  Customise
</button>
```

- [ ] **Step 4: Manual smoke test**

Start the dev server. Log in, go to your profile, click "Customise". Verify:
- All four tabs render
- Items appear in the grid (2 per tab)
- Clicking an avatar/badge/banner item shows "Equipped" on the selected item
- Refreshing the page and returning to Customise shows the same item still selected
- Emoji tab shows the emoji characters (no equip behaviour)

- [ ] **Step 5: Commit**

```bash
git add src/components/profile/CustomisePage.tsx src/App.tsx src/components/profile/ProfilePage.tsx
git commit -m "feat: CustomisePage — equip avatar, badge, banner from owned inventory"
```

---

### Task 5: Display equipped cosmetics on ProfilePage

**Files:**
- Modify: `src/components/profile/ProfilePage.tsx`

Update the profile display to read the equipped avatar/badge/banner from cosmetic_items and render them, replacing the old `avatar_url` fallback where applicable.

- [ ] **Step 1: Extend the profile data fetch**

In the `loadProfile` function inside `ProfilePage.tsx`, extend the `profiles` query to also fetch equipped item asset URLs:

```typescript
const { data: profileData } = await supabase
  .from('profiles')
  .select(`
    id, username, avatar_url,
    active_avatar_id, active_badge_id, active_banner_id,
    avatar_item:cosmetic_items!active_avatar_id(asset_url),
    badge_item:cosmetic_items!active_badge_id(asset_url, name),
    banner_item:cosmetic_items!active_banner_id(asset_url),
    player_stats(rank_tier, wins, losses, draws)
  `)
  .eq('username', username)
  .single();
```

Add `avatarUrl`, `badgeUrl`, `badgeName`, `bannerUrl` to the `ProfileData` interface and set them from the query result.

- [ ] **Step 2: Update the avatar render**

Replace the existing avatar block (currently renders `profile.avatar_url` or initial letter) with:

```tsx
<div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#1a2332', overflow: 'hidden', border: '2px solid #4a5568', flexShrink: 0 }}>
  {profile.avatarUrl
    ? <img src={profile.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: '#a0aec0' }}>
        {profile.username[0]?.toUpperCase()}
      </div>
  }
</div>
```

- [ ] **Step 3: Add badge display next to username**

In the username row, add the badge after the `LevelBadge`:

```tsx
<div style={{ fontSize: '22px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
  {profile.username}
  <LevelBadge level={profile.level} size="md" />
  {profile.badgeUrl && (
    <img src={profile.badgeUrl} alt={profile.badgeName ?? 'badge'}
      style={{ width: '20px', height: '20px' }} title={profile.badgeName ?? ''} />
  )}
</div>
```

- [ ] **Step 4: Add banner as profile card background**

In the profile card container (the `div` with `background: '#2a3441'`), add the banner as a background image if set:

```tsx
<div style={{
  background: '#2a3441', borderRadius: '12px', padding: '24px', marginBottom: '16px',
  display: 'flex', alignItems: 'center', gap: '20px',
  ...(profile.bannerUrl ? {
    backgroundImage: `url(${profile.bannerUrl})`,
    backgroundSize: 'cover', backgroundPosition: 'center',
  } : {}),
}}>
```

- [ ] **Step 5: Manual smoke test**

In the browser:
1. Go to your profile → verify avatar/badge/banner from the seeded defaults display correctly
2. Go to `/customise`, switch to "Classic Orange" avatar → go back to profile → verify avatar changed
3. Switch banner to "Ocean" → go back to profile → verify the profile card background changed
4. View another player's profile → they should also show their equipped cosmetics (or defaults if none set)

- [ ] **Step 6: Commit**

```bash
git add src/components/profile/ProfilePage.tsx
git commit -m "feat(profile): display equipped avatar, badge, and banner from cosmetic_items"
```

---

## Subsystem B: Emoji Communication

---

### Task 6: Add emoji broadcast to `useOnlineGame`

**Files:**
- Modify: `src/hooks/useOnlineGame.ts`

Add `sendEmoji(emoji: string)` which broadcasts on the existing channel, and state for displaying incoming/outgoing emoji bubbles.

- [ ] **Step 1: Read `useOnlineGame.ts` first**

Read the full file before editing. Identify:
- Where the Supabase channel is subscribed (look for `supabase.channel(...)`)
- Where broadcast events are handled (look for `.on('broadcast', ...)`)
- The return value of the hook (what it currently exposes)

- [ ] **Step 2: Add emoji state + handler**

After the existing state declarations near the top of the hook, add:

```typescript
const [myEmoji, setMyEmoji] = useState<string | null>(null);
const [opponentEmoji, setOpponentEmoji] = useState<string | null>(null);
const myEmojiTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
const opponentEmojiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

In the channel's broadcast handler (`.on('broadcast', { event: '...' }, ...)`), add a new case for emoji events. The exact structure depends on how existing broadcast events are handled — follow the same pattern. Add:

```typescript
.on('broadcast', { event: 'emoji' }, ({ payload }: { payload: { player_id: string; emoji: string } }) => {
  if (payload.player_id !== user?.id) {
    if (opponentEmojiTimerRef.current) clearTimeout(opponentEmojiTimerRef.current);
    setOpponentEmoji(payload.emoji);
    opponentEmojiTimerRef.current = setTimeout(() => setOpponentEmoji(null), 3000);
  }
})
```

- [ ] **Step 3: Add `sendEmoji` function**

```typescript
const sendEmoji = useCallback((emoji: string) => {
  if (!channel || !user) return;
  if (myEmojiTimerRef.current) clearTimeout(myEmojiTimerRef.current);
  setMyEmoji(emoji);
  myEmojiTimerRef.current = setTimeout(() => setMyEmoji(null), 3000);
  channel.send({
    type: 'broadcast',
    event: 'emoji',
    payload: { player_id: user.id, emoji },
  });
}, [channel, user]);
```

**Note:** `channel` must be the ref/state variable that holds the subscribed channel. Check the actual variable name in the existing code before writing.

- [ ] **Step 4: Expose from hook return**

Add `myEmoji`, `opponentEmoji`, and `sendEmoji` to the hook's return object.

- [ ] **Step 5: Clean up timers on unmount**

In the hook's cleanup `useEffect` (or add one), clear both timers:

```typescript
return () => {
  if (myEmojiTimerRef.current)       clearTimeout(myEmojiTimerRef.current);
  if (opponentEmojiTimerRef.current) clearTimeout(opponentEmojiTimerRef.current);
};
```

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useOnlineGame.ts
git commit -m "feat(online): add emoji broadcast — sendEmoji, myEmoji, opponentEmoji state"
```

---

### Task 7: `EmojiPanel` + `EmojiBubble` components

**Files:**
- Create: `src/components/game/EmojiPanel.tsx`
- Create: `src/components/game/EmojiBubble.tsx`

- [ ] **Step 1: Write `EmojiBubble`**

A simple floating bubble that renders an emoji. Positioned absolutely relative to its parent container.

```tsx
// src/components/game/EmojiBubble.tsx
import React from 'react';

interface Props {
  emoji: string;
  side: 'left' | 'right'; // which side of the board
}

const EmojiBubble: React.FC<Props> = ({ emoji, side }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    [side]: '-60px',
    transform: 'translateY(-50%)',
    background: '#2a3441',
    border: '2px solid #4a5568',
    borderRadius: '50%',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    animation: 'emojiBounce 0.3s ease-out',
    zIndex: 10,
    pointerEvents: 'none',
  }}>
    {emoji}
  </div>
);

export default EmojiBubble;
```

Add the keyframe animation to `src/components/animations.css`:

```css
@keyframes emojiBounce {
  0%   { transform: translateY(-50%) scale(0.5); opacity: 0; }
  70%  { transform: translateY(-50%) scale(1.1); opacity: 1; }
  100% { transform: translateY(-50%) scale(1);   opacity: 1; }
}
```

- [ ] **Step 2: Write `EmojiPanel`**

A quick-select panel showing the player's owned emojis. Appears on button press, hides after selection or second press.

```tsx
// src/components/game/EmojiPanel.tsx
import React, { useState } from 'react';
import { useInventory } from '../../hooks/useInventory';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  onSend: (emoji: string) => void;
}

const EmojiPanel: React.FC<Props> = ({ onSend }) => {
  const { user } = useAuth();
  const { items } = useInventory(user?.id, 'emoji');
  const [open, setOpen] = useState(false);

  const handleSend = (emoji: string | null) => {
    if (!emoji) return;
    onSend(emoji);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: '#2a3441', border: '1px solid #4a5568',
          borderRadius: '8px', padding: '8px 12px',
          color: '#a0aec0', cursor: 'pointer', fontSize: '18px',
        }}
        title="Send emoji"
      >
        😊
      </button>

      {open && items.length > 0 && (
        <div style={{
          position: 'absolute', bottom: '44px', left: 0,
          background: '#2a3441', border: '1px solid #4a5568',
          borderRadius: '10px', padding: '8px',
          display: 'flex', gap: '6px', zIndex: 20,
        }}>
          {items.map(item => (
            <button
              key={item.item_id}
              onClick={() => handleSend(item.asset_url ?? '')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '24px', padding: '4px', borderRadius: '6px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#3a4a5a')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              {item.asset_url}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmojiPanel;
```

- [ ] **Step 3: Commit**

```bash
git add src/components/game/EmojiPanel.tsx src/components/game/EmojiBubble.tsx src/components/animations.css
git commit -m "feat: EmojiPanel + EmojiBubble components for in-game emoji communication"
```

---

### Task 8: Wire emoji into `OnlineGameView`

**Files:**
- Modify: `src/components/game/OnlineGameView.tsx`

- [ ] **Step 1: Read the file first**

Read `OnlineGameView.tsx` before editing. Find:
- Where `useOnlineGame` is destructured — add `myEmoji`, `opponentEmoji`, `sendEmoji` here
- Where the game board is rendered — this is where bubbles are positioned
- A suitable place for the EmojiPanel button (near the player controls area)

- [ ] **Step 2: Import components**

```tsx
import EmojiPanel from './EmojiPanel';
import EmojiBubble from './EmojiBubble';
```

- [ ] **Step 3: Destructure new values from useOnlineGame**

```tsx
const { ..., myEmoji, opponentEmoji, sendEmoji } = useOnlineGame(gameId);
```

- [ ] **Step 4: Add bubbles and panel to the render**

Wrap the board area in a `position: 'relative'` container if not already. Add:

```tsx
{/* Emoji bubbles */}
{myEmoji       && <EmojiBubble emoji={myEmoji}       side="left"  />}
{opponentEmoji && <EmojiBubble emoji={opponentEmoji} side="right" />}

{/* Emoji panel — only show during active game */}
{status === 'active' && <EmojiPanel onSend={sendEmoji} />}
```

Position the panel below or beside the board — follow the existing layout.

- [ ] **Step 5: Manual smoke test**

Open two browser tabs, log in as two different accounts. Start an online game:
1. Click the emoji button → panel opens showing 👍 and 🔥
2. Click 👍 → bubble appears near your side of the board
3. On the other tab → 👍 bubble appears on the opponent's side
4. Bubble disappears after ~3 seconds on both sides
5. Verify clicking the emoji button again closes the panel

- [ ] **Step 6: Commit**

```bash
git add src/components/game/OnlineGameView.tsx
git commit -m "feat(game): wire emoji panel and bubbles into OnlineGameView"
```

---

## Final checks

- [ ] **End-to-end walkthrough**
  1. Log in → profile shows default avatar, badge, banner
  2. Go to Customise → switch avatar to "Classic Orange" → back to profile → avatar updated
  3. Switch banner to "Ocean" → profile card shows gradient background
  4. Play an online game → emoji button visible → send emoji → both players see bubble → bubble disappears

- [ ] **Update the handover**

Update `docs/plans/RESTART-HANDOVER.md`:
- Mark Phase 4 as complete in the roadmap table
- Add Phase 4 to "What is built and working"
- Add confirmed working items to the live testing section
- Update the session start prompt
- Note Phase 5 as next

---

## Known limitations (acceptable for Phase 4)

- Emoji is broadcast-only — if the realtime connection is degraded, an emoji may not arrive. This is acceptable; emojis are cosmetic, not game-critical.
- Badge and banner are visible on profile page only — they are not shown in-game or on the leaderboard. That's a Phase 5 visual redesign concern.
- The `emojiBounce` animation will not play on subsequent emojis from the same player within 3 seconds (the component is already mounted). This is a minor UX limitation; acceptable for Phase 4.
- Asset URLs use SVG data URIs for Phase 4 placeholders. Real art assets via Supabase Storage are a Phase 5/6 task.
