# Phase 6 — Cash Shop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/shop` page where players spend earned in-game credits on cosmetic items via an atomic Postgres RPC, with navigation from both `MainMenu` and `CustomisePage`.

**Architecture:** A `purchase_item` SECURITY DEFINER Postgres RPC handles the entire purchase atomically (balance lock → deduct → grant → log). Two new hooks (`useShop`, `usePurchase`) expose the catalogue and purchase call. Three new components (`ShopPage`, `ShopItemCard`, `PurchaseConfirmModal`) render the UI. All styling is inline CSS using `tokens` from `src/styles/tokens.ts` — no CSS framework.

**Tech Stack:** React (CRA, TypeScript), Supabase Postgres RPC, `cosmetic_items` / `player_inventory` / `currency_balance` / `transactions` tables, `useProgression` for balance, Phase 5 shared components (`Glass`, `PrimaryButton`, `PageBackground`, `TabBar`).

**Spec:** `docs/superpowers/specs/2026-05-29-phase6-cash-shop-design.md`

---

## File Map

**Create:**
- `supabase/migrations/20260529000001_phase6_shop.sql` — `purchase_item` RPC + 13 paid cosmetic items
- `src/hooks/useShop.ts` — fetches paid catalogue + own inventory, returns `ShopItem[]` with `owned: boolean`
- `src/hooks/usePurchase.ts` — wraps `supabase.rpc('purchase_item')`, manages `purchasing`/`error` state
- `src/components/shop/ShopPage.tsx` — `/shop` route: tab bar, item grid, credit balance header
- `src/components/shop/ShopItemCard.tsx` — single item tile: preview, price, Buy/Owned state
- `src/components/shop/PurchaseConfirmModal.tsx` — confirm overlay before RPC call

**Modify:**
- `src/App.tsx:89-98` — add `/shop` **inside** existing `<Route element={<ProtectedRoute />}>` layout block
- `src/components/MainMenu.tsx:42-47` (`DESKTOP_NAV`) — add `{ label: 'Shop', path: '/shop' }`
- `src/components/MainMenu.tsx:249-253` (`MOBILE_NAV`) — add `{ label: 'Shop', path: '/shop' }`
- `src/components/profile/CustomisePage.tsx:199` — add "Get more items →" link below item grid / empty state
- `src/components/common/TabBar.tsx:19-26` (`pathToTab`) — add `'/shop': 'home'`

---

### Task 1: DB Migration — `purchase_item` RPC + paid item seed

**Files:**
- Create: `supabase/migrations/20260529000001_phase6_shop.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260529000001_phase6_shop.sql` with this exact content:

```sql
-- Phase 6: purchase_item RPC + paid cosmetic catalogue
-- Note: transactions table + its SELECT policy already exist from initial schema — no changes needed.
-- Note: user_skins/user_equipped_skins RLS policies already exist from Phase 2 — no changes needed.

-- ── 1. purchase_item RPC ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.purchase_item(p_item_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id UUID;
  v_price     INTEGER;
  v_coins     INTEGER;
  v_owned     BOOLEAN;
BEGIN
  v_player_id := auth.uid();
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  -- Look up item price
  SELECT price INTO v_price FROM public.cosmetic_items WHERE id = p_item_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'item_not_found');
  END IF;
  IF v_price IS NULL OR v_price = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'item_not_purchasable');
  END IF;

  -- Check already owned
  SELECT EXISTS (
    SELECT 1 FROM public.player_inventory
    WHERE player_id = v_player_id AND item_id = p_item_id
  ) INTO v_owned;
  IF v_owned THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_owned');
  END IF;

  -- Lock balance row and check funds (FOR UPDATE prevents double-spend)
  SELECT coins INTO v_coins
  FROM public.currency_balance
  WHERE player_id = v_player_id
  FOR UPDATE;

  IF v_coins IS NULL OR v_coins < v_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_credits');
  END IF;

  -- Deduct credits
  UPDATE public.currency_balance
  SET coins = coins - v_price
  WHERE player_id = v_player_id;

  -- Grant item to inventory
  INSERT INTO public.player_inventory (player_id, item_id, acquisition_source)
  VALUES (v_player_id, p_item_id, 'purchased');

  -- Log transaction (type='purchase', amount=credits spent)
  INSERT INTO public.transactions (player_id, type, amount, item_id)
  VALUES (v_player_id, 'purchase', v_price, p_item_id);

  RETURN jsonb_build_object('success', true, 'new_balance', v_coins - v_price);
END;
$$;

-- ── 2. Paid cosmetic catalogue (13 items, source='shop') ──────────────────────
INSERT INTO public.cosmetic_items (id, name, type, asset_url, price, rarity, source, animated) VALUES

  -- Avatars
  ('00000000-0000-0006-0001-000000000001', 'Neon Teal',  'avatar',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><circle cx=%2220%22 cy=%2220%22 r=%2220%22 fill=%22%2300d4aa%22/><text x=%2220%22 y=%2226%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2214%22 font-family=%22sans-serif%22>OX</text></svg>',
   200, 'common', 'shop', false),

  ('00000000-0000-0006-0001-000000000002', 'Crimson', 'avatar',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><circle cx=%2220%22 cy=%2220%22 r=%2220%22 fill=%22%23e53e3e%22/><text x=%2220%22 y=%2226%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2214%22 font-family=%22sans-serif%22>OX</text></svg>',
   200, 'common', 'shop', false),

  ('00000000-0000-0006-0001-000000000003', 'Gold', 'avatar',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><circle cx=%2220%22 cy=%2220%22 r=%2220%22 fill=%22%23f6ad55%22/><text x=%2220%22 y=%2226%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2214%22 font-family=%22sans-serif%22>OX</text></svg>',
   500, 'rare', 'shop', false),

  -- Badges
  ('00000000-0000-0006-0002-000000000001', 'Veteran', 'badge',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22><polygon points=%2210,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7%22 fill=%22%23c05621%22/></svg>',
   150, 'common', 'shop', false),

  ('00000000-0000-0006-0002-000000000002', 'Champion', 'badge',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22><polygon points=%2210,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7%22 fill=%22%234299e1%22/></svg>',
   300, 'common', 'shop', false),

  ('00000000-0000-0006-0002-000000000003', 'Legend', 'badge',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22><polygon points=%2210,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7%22 fill=%22%23d69e2e%22/></svg>',
   500, 'rare', 'shop', false),

  -- Banners
  ('00000000-0000-0006-0003-000000000001', 'Sunset', 'banner',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 60%22><defs><linearGradient id=%22g%22 x1=%220%22 x2=%221%22><stop offset=%220%22 stop-color=%22%23f6ad55%22/><stop offset=%221%22 stop-color=%22%23e53e3e%22/></linearGradient></defs><rect width=%22300%22 height=%2260%22 fill=%22url(%23g)%22/></svg>',
   200, 'common', 'shop', false),

  ('00000000-0000-0006-0003-000000000002', 'Forest', 'banner',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 60%22><defs><linearGradient id=%22g%22 x1=%220%22 x2=%221%22><stop offset=%220%22 stop-color=%22%2338a169%22/><stop offset=%221%22 stop-color=%22%222d6a4f%22/></linearGradient></defs><rect width=%22300%22 height=%2260%22 fill=%22url(%23g)%22/></svg>',
   200, 'common', 'shop', false),

  ('00000000-0000-0006-0003-000000000003', 'Void', 'banner',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 60%22><defs><linearGradient id=%22g%22 x1=%220%22 x2=%221%22><stop offset=%220%22 stop-color=%22%234a1d96%22/><stop offset=%221%22 stop-color=%22%23060d1f%22/></linearGradient></defs><rect width=%22300%22 height=%2260%22 fill=%22url(%23g)%22/></svg>',
   350, 'common', 'shop', false),

  -- Board skins (inventory only — no in-game render in Phase 6)
  ('00000000-0000-0006-0004-000000000001', 'Neon Grid', 'board',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 60%22><rect width=%2260%22 height=%2260%22 fill=%22%23060d1f%22/><line x1=%2220%22 y1=%220%22 x2=%2220%22 y2=%2260%22 stroke=%22%2300d4aa%22 stroke-width=%221.5%22/><line x1=%2240%22 y1=%220%22 x2=%2240%22 y2=%2260%22 stroke=%22%2300d4aa%22 stroke-width=%221.5%22/><line x1=%220%22 y1=%2220%22 x2=%2260%22 y2=%2220%22 stroke=%22%2300d4aa%22 stroke-width=%221.5%22/><line x1=%220%22 y1=%2240%22 x2=%2260%22 y2=%2240%22 stroke=%22%2300d4aa%22 stroke-width=%221.5%22/></svg>',
   300, 'common', 'shop', false),

  ('00000000-0000-0006-0004-000000000002', 'Minimal', 'board',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 60%22><rect width=%2260%22 height=%2260%22 fill=%22%23f7fafc%22/><line x1=%2220%22 y1=%225%22 x2=%2220%22 y2=%2255%22 stroke=%22%23cbd5e0%22 stroke-width=%221%22/><line x1=%2240%22 y1=%225%22 x2=%2240%22 y2=%2255%22 stroke=%22%23cbd5e0%22 stroke-width=%221%22/><line x1=%225%22 y1=%2220%22 x2=%2255%22 y2=%2220%22 stroke=%22%23cbd5e0%22 stroke-width=%221%22/><line x1=%225%22 y1=%2240%22 x2=%2255%22 y2=%2240%22 stroke=%22%23cbd5e0%22 stroke-width=%221%22/></svg>',
   250, 'common', 'shop', false),

  -- Marker skins (inventory only — no in-game render in Phase 6)
  ('00000000-0000-0006-0005-000000000001', 'Neon Set', 'marker',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 60%22><rect width=%2260%22 height=%2260%22 fill=%22%23060d1f%22/><text x=%2215%22 y=%2238%22 font-size=%2224%22 font-family=%22sans-serif%22 font-weight=%22900%22 fill=%22%2300d4aa%22>X</text><text x=%2236%22 y=%2238%22 font-size=%2224%22 font-family=%22sans-serif%22 font-weight=%22900%22 fill=%22%237c4dff%22>O</text></svg>',
   350, 'common', 'shop', false),

  ('00000000-0000-0006-0005-000000000002', 'Pixel Set', 'marker',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 60%22><rect width=%2260%22 height=%2260%22 fill=%22%231a2332%22/><text x=%2215%22 y=%2238%22 font-size=%2224%22 font-family=%22monospace%22 font-weight=%22900%22 fill=%22%23f6ad55%22>X</text><text x=%2236%22 y=%2238%22 font-size=%2224%22 font-family=%22monospace%22 font-weight=%22900%22 fill=%22%23fc8181%22>O</text></svg>',
   300, 'common', 'shop', false)

ON CONFLICT (id) DO NOTHING;
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use `mcp__plugin_supabase_supabase__apply_migration` with:
- `project_id: "qioxtkcjtvvkzcoupdfk"`
- `name: "phase6_shop"`
- `query`: the full SQL above

- [ ] **Step 3: Verify the migration applied correctly**

Run via `mcp__plugin_supabase_supabase__execute_sql`:
```sql
SELECT id, name, type, price, rarity FROM public.cosmetic_items WHERE source = 'shop' ORDER BY type, price;
```
Expected: 13 rows across avatar/badge/banner/board/marker types.

Also verify the function exists:
```sql
SELECT routine_name FROM information_schema.routines WHERE routine_name = 'purchase_item';
```
Expected: 1 row.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260529000001_phase6_shop.sql
git commit -m "feat: Phase 6 migration — purchase_item RPC + paid cosmetic seed"
```

---

### Task 2: `useShop` hook

**Files:**
- Create: `src/hooks/useShop.ts`

- [ ] **Step 1: Write the hook**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ShopItem {
  id: string;
  name: string;
  type: string;
  asset_url: string | null;
  price: number;
  rarity: string;
  owned: boolean;
}

export function useShop(userId: string | undefined) {
  const [catalogue, setCatalogue] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShop = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [{ data: items, error: itemErr }, { data: inventory, error: invErr }] = await Promise.all([
        supabase
          .from('cosmetic_items')
          .select('id, name, type, asset_url, price, rarity')
          .gt('price', 0),
        supabase
          .from('player_inventory')
          .select('item_id')
          .eq('player_id', userId),
      ]);

      if (itemErr) throw itemErr;
      if (invErr)  throw invErr;

      const ownedIds = new Set((inventory ?? []).map((r: any) => r.item_id as string));
      setCatalogue(
        (items ?? []).map((item: any): ShopItem => ({
          id:        item.id,
          name:      item.name,
          type:      item.type,
          asset_url: item.asset_url,
          price:     item.price,
          rarity:    item.rarity,
          owned:     ownedIds.has(item.id),
        }))
      );
      setError(null);
    } catch (err) {
      console.error('useShop fetch failed:', err);
      setError('Failed to load shop.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchShop();
  }, [fetchShop]);

  return { catalogue, loading, error, refetch: fetchShop };
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```
Expected: no errors in `useShop.ts`

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useShop.ts
git commit -m "feat: add useShop hook — catalogue + inventory fetch"
```

---

### Task 3: `usePurchase` hook

**Files:**
- Create: `src/hooks/usePurchase.ts`

- [ ] **Step 1: Write the hook**

```typescript
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const RPC_ERRORS: Record<string, string> = {
  not_authenticated:    'You must be logged in to purchase.',
  item_not_found:       'Item no longer available.',
  item_not_purchasable: 'This item cannot be purchased.',
  already_owned:        'You already own this item.',
  insufficient_credits: 'Not enough credits.',
};

export function usePurchase(onSuccess: () => void) {
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const purchase = useCallback(async (itemId: string) => {
    setPurchasing(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('purchase_item', { p_item_id: itemId });
      if (rpcError) throw new Error('Purchase failed. Please try again.');
      if (!data?.success) {
        throw new Error(RPC_ERRORS[data?.error as string] ?? 'Purchase failed. Please try again.');
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message ?? 'Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  }, [onSuccess]);

  const clearError = useCallback(() => setError(null), []);

  return { purchase, purchasing, error, clearError };
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```
Expected: no errors in `usePurchase.ts`

- [ ] **Step 3: Commit**

```bash
git add src/hooks/usePurchase.ts
git commit -m "feat: add usePurchase hook — RPC wrapper with error handling"
```

---

### Task 4: `ShopItemCard` component

**Files:**
- Create: `src/components/shop/ShopItemCard.tsx`

- [ ] **Step 1: Write the component**

```typescript
import React from 'react';
import { tokens } from '../../styles/tokens';
import { Coin } from '../icons';
import { ShopItem } from '../../hooks/useShop';

interface Props {
  item: ShopItem;
  onBuy: () => void;
  purchasing: boolean;
  balance: number;
}

const ItemPreview: React.FC<{ item: ShopItem }> = ({ item }) => {
  if (item.type === 'banner') {
    return (
      <div style={{ width: '100%', height: 28, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
        {item.asset_url && (
          <img src={item.asset_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>
    );
  }
  if (item.type === 'avatar') {
    const size = 44;
    return item.asset_url
      ? <img src={item.asset_url} alt={item.name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
      : <div style={{ width: size, height: size, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />;
  }
  // badge, board, marker — square preview
  const size = 36;
  const radius = item.type === 'badge' ? '50%' : '8px';
  return item.asset_url
    ? <img src={item.asset_url} alt={item.name} style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover' }} />
    : <div style={{ width: size, height: size, borderRadius: radius, background: 'rgba(255,255,255,0.08)' }} />;
};

const RarityColor: Record<string, string> = {
  common:    tokens.textDim,
  rare:      tokens.accent,
  epic:      '#9f7aea',
  legendary: tokens.credits,
};

export const ShopItemCard: React.FC<Props> = ({ item, onBuy, purchasing, balance }) => {
  const canAfford = balance >= item.price;
  const isDisabled = item.owned || purchasing || !canAfford;

  return (
    <div style={{
      padding: 10, borderRadius: 14,
      background: item.owned ? 'rgba(0,212,170,0.06)' : 'rgba(255,255,255,0.04)',
      outline: item.owned
        ? `1.5px solid ${tokens.accent}`
        : '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      fontFamily: tokens.font,
      position: 'relative',
    }}>
      {/* Rarity dot */}
      {item.rarity !== 'common' && (
        <div style={{
          position: 'absolute', top: 6, left: 6,
          width: 6, height: 6, borderRadius: '50%',
          background: RarityColor[item.rarity] ?? tokens.textDim,
        }} />
      )}

      <ItemPreview item={item} />

      <span style={{ fontSize: 10, color: tokens.textMuted, textAlign: 'center', fontWeight: 600, lineHeight: 1.3 }}>
        {item.name}
      </span>

      {item.owned ? (
        <div style={{
          padding: '3px 10px', borderRadius: tokens.rPill,
          background: 'rgba(0,212,170,0.15)',
          fontSize: 9, fontWeight: 800, letterSpacing: 0.6,
          color: tokens.accent, textTransform: 'uppercase',
        }}>
          Owned
        </div>
      ) : (
        <button
          onClick={onBuy}
          disabled={isDisabled}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: tokens.rPill,
            background: canAfford && !purchasing
              ? 'rgba(0,212,170,0.18)'
              : 'rgba(255,255,255,0.05)',
            border: canAfford && !purchasing
              ? `1px solid ${tokens.accent}`
              : '1px solid rgba(255,255,255,0.10)',
            color: canAfford && !purchasing ? tokens.accent : tokens.textDim,
            fontSize: 10, fontWeight: 800, cursor: isDisabled ? 'not-allowed' : 'pointer',
            fontFamily: tokens.font,
            opacity: isDisabled ? 0.6 : 1,
          }}
        >
          <Coin size={10} />
          {item.price.toLocaleString()}
        </button>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```
Expected: no errors in `ShopItemCard.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/shop/ShopItemCard.tsx
git commit -m "feat: add ShopItemCard component"
```

---

### Task 5: `PurchaseConfirmModal` component

**Files:**
- Create: `src/components/shop/PurchaseConfirmModal.tsx`

- [ ] **Step 1: Write the component**

```typescript
import React from 'react';
import { tokens } from '../../styles/tokens';
import { Coin } from '../icons';
import Glass from '../common/Glass';
import PrimaryButton from '../common/PrimaryButton';
import SecondaryButton from '../common/SecondaryButton';
import { ShopItem } from '../../hooks/useShop';

interface Props {
  item: ShopItem;
  balance: number;
  purchasing: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PurchaseConfirmModal: React.FC<Props> = ({
  item, balance, purchasing, error, onConfirm, onCancel,
}) => (
  <div
    style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(6,13,31,0.80)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}
    onClick={purchasing ? undefined : onCancel}
  >
    <Glass
      style={{ maxWidth: 340, width: '100%', padding: 0 }}
      >
      {/* Inner div stops backdrop click from closing modal — Glass does not accept onClick */}
      <div
        style={{ padding: 24, fontFamily: tokens.font }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div style={{
          fontSize: 12, fontWeight: 700, letterSpacing: 1.2,
          color: tokens.textMuted, textTransform: 'uppercase', marginBottom: 6,
        }}>
          Confirm Purchase
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, color: tokens.text, marginBottom: 20 }}>
          {item.name}
        </div>

        {/* Cost row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px',
          background: tokens.innerBg, borderRadius: 10, border: tokens.innerBorder,
          marginBottom: 8,
        }}>
          <span style={{ fontSize: 13, color: tokens.textMuted, fontWeight: 600 }}>Cost</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 800, color: tokens.credits, fontSize: 14 }}>
            <Coin size={13} />
            {item.price.toLocaleString()}
          </span>
        </div>

        {/* Balance after */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px',
          background: tokens.innerBg, borderRadius: 10, border: tokens.innerBorder,
          marginBottom: 20,
        }}>
          <span style={{ fontSize: 13, color: tokens.textMuted, fontWeight: 600 }}>Balance after</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 800, color: tokens.text, fontSize: 14 }}>
            <Coin size={13} />
            {(balance - item.price).toLocaleString()}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '8px 12px', borderRadius: 8, marginBottom: 16,
            background: 'rgba(229,62,62,0.12)', border: '1px solid rgba(229,62,62,0.30)',
            color: tokens.loss, fontSize: 12, fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <SecondaryButton onClick={onCancel} disabled={purchasing} style={{ flex: 1 }}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={onConfirm} disabled={purchasing} style={{ flex: 1 }}>
            {purchasing ? 'Buying…' : 'Buy'}
          </PrimaryButton>
        </div>
      </div>
    </Glass>
  </div>
);
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```
Expected: no errors in `PurchaseConfirmModal.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/shop/PurchaseConfirmModal.tsx
git commit -m "feat: add PurchaseConfirmModal component"
```

---

### Task 6: `ShopPage` component

**Files:**
- Create: `src/components/shop/ShopPage.tsx`

- [ ] **Step 1: Write the component**

```typescript
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useShop, ShopItem } from '../../hooks/useShop';
import { usePurchase } from '../../hooks/usePurchase';
import { useProgression } from '../../hooks/useProgression';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';
import { useIsMobile } from '../../hooks/useIsMobile';
import { tokens } from '../../styles/tokens';
import PageBackground from '../common/PageBackground';
import Glass from '../common/Glass';
import TabBar from '../common/TabBar';
import { ChevronLeft, Coin } from '../icons';
import { ShopItemCard } from './ShopItemCard';
import { PurchaseConfirmModal } from './PurchaseConfirmModal';

type STab = 'avatar' | 'badge' | 'banner' | 'skins';

const TABS: { key: STab; label: string }[] = [
  { key: 'avatar', label: 'Avatar' },
  { key: 'badge',  label: 'Badge'  },
  { key: 'banner', label: 'Banner' },
  { key: 'skins',  label: 'Skins'  },
];

// 'skins' tab covers both board and marker types
const TAB_TYPES: Record<STab, string[]> = {
  avatar: ['avatar'],
  badge:  ['badge'],
  banner: ['banner'],
  skins:  ['board', 'marker'],
};

const ShopPage: React.FC = () => {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const profile   = usePlayerProfile();
  const isMobile  = useIsMobile();

  const [tab, setTab]               = useState<STab>('avatar');
  const [pendingItem, setPendingItem] = useState<ShopItem | null>(null);

  const { catalogue, loading, error: shopError, refetch } = useShop(user?.id);
  const { credits, refresh: refreshProgression, loading: progressionLoading } = useProgression(user?.id);

  const handleSuccess = useCallback(() => {
    refetch();
    refreshProgression();
    setPendingItem(null);
  }, [refetch, refreshProgression]);

  const { purchase, purchasing, error: purchaseError, clearError } = usePurchase(handleSuccess);

  const tabItems = catalogue.filter(item => TAB_TYPES[tab].includes(item.type));

  return (
    <PageBackground>
      <div style={{
        fontFamily: tokens.font, color: tokens.text,
        maxWidth: 600, margin: '0 auto',
        padding: '0 16px', paddingBottom: isMobile ? 100 : 60,
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0 12px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted, padding: 4, lineHeight: 0 }}
          >
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontSize: 18, fontWeight: 800, flex: 1 }}>Shop</span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 10px', borderRadius: tokens.rPill,
            background: 'rgba(249,168,37,0.12)', border: '1px solid rgba(249,168,37,0.25)',
          }}>
            <Coin size={14} />
            <span style={{ fontSize: 13, fontWeight: 800, color: tokens.credits }}>
              {progressionLoading ? '–' : credits.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.04)',
          borderRadius: tokens.glassRadius, padding: 4, marginBottom: 16,
        }}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: tab === key ? 'rgba(0,212,170,0.18)' : 'transparent',
                color: tab === key ? tokens.accent : tokens.textMuted,
                fontWeight: tab === key ? 800 : 600, fontSize: 12, fontFamily: tokens.font,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Skins inventory-only notice */}
        {tab === 'skins' && (
          <Glass style={{ marginBottom: 12, padding: '10px 14px' }}>
            <span style={{ fontSize: 11, color: tokens.textMuted, fontWeight: 600 }}>
              Board and marker skins go into your inventory. In-game visual unlocks coming soon.
            </span>
          </Glass>
        )}

        {/* Error state */}
        {shopError && (
          <div style={{
            padding: '12px 16px', borderRadius: 10, marginBottom: 16,
            background: 'rgba(229,62,62,0.10)', border: '1px solid rgba(229,62,62,0.25)',
            color: tokens.loss, fontSize: 13,
          }}>
            {shopError}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: tokens.textMuted, fontSize: 14 }}>
            Loading…
          </div>
        )}

        {/* Item grid */}
        {!loading && tabItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: tokens.textDim, fontSize: 14 }}>
            No items available in this category yet.
          </div>
        )}

        {!loading && tabItems.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {tabItems.map(item => (
              <ShopItemCard
                key={item.id}
                item={item}
                balance={credits}
                purchasing={purchasing}
                onBuy={() => { clearError(); setPendingItem(item); }}
              />
            ))}
          </div>
        )}
      </div>

      {isMobile && <TabBar username={profile?.username ?? undefined} />}

      {/* Confirm modal */}
      {pendingItem && (
        <PurchaseConfirmModal
          item={pendingItem}
          balance={credits}
          purchasing={purchasing}
          error={purchaseError}
          onConfirm={() => purchase(pendingItem.id)}
          onCancel={() => { if (!purchasing) setPendingItem(null); }}
        />
      )}
    </PageBackground>
  );
};

export default ShopPage;
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/shop/ShopPage.tsx
git commit -m "feat: add ShopPage component"
```

---

### Task 7: Wire navigation

**Files:**
- Modify: `src/App.tsx:89-98`
- Modify: `src/components/MainMenu.tsx:42-47` (DESKTOP_NAV)
- Modify: `src/components/MainMenu.tsx:249-253` (MOBILE_NAV)
- Modify: `src/components/profile/CustomisePage.tsx:199`

- [ ] **Step 1: Add `/shop` route to `App.tsx`**

In `src/App.tsx`, add the import at the top with the other page imports:
```typescript
import ShopPage from './components/shop/ShopPage';
```

Then inside the `<Route element={<ProtectedRoute />}>` block (currently lines 89-98), add:
```typescript
<Route path="/shop" element={<ShopPage />} />
```

The block should look like:
```typescript
{/* Protected routes */}
<Route element={<ProtectedRoute />}>
  <Route path="/menu"             element={<MainMenu />} />
  <Route path="/onboarding"       element={<OnboardingPage />} />
  <Route path="/profile/:username" element={<ProfilePage />} />
  <Route path="/settings"         element={<SettingsPage />} />
  <Route path="/game/:id"         element={<OnlineGameRoute />} />
  <Route path="/matchmaking"      element={<MatchmakingPage />} />
  <Route path="/achievements"     element={<AchievementsPage />} />
  <Route path="/customise"        element={<CustomisePage />} />
  <Route path="/shop"             element={<ShopPage />} />
</Route>
```

**Important:** `/shop` must be **inside** the `<Route element={<ProtectedRoute />}>` layout block, not wrapped around it. `ProtectedRoute` renders `<Outlet />` not `{children}` — putting `<ShopPage />` as a child prop would silently produce a blank page.

- [ ] **Step 2: Add Shop to `DESKTOP_NAV` in `MainMenu.tsx`**

In `src/components/MainMenu.tsx`, find `DESKTOP_NAV` (around line 42) and add the Shop entry:

```typescript
const DESKTOP_NAV = [
  { label: 'Home',         path: '/menu' },
  { label: 'Leaderboard',  path: '/leaderboard' },
  { label: 'Achievements', path: '/achievements' },
  { label: 'Shop',         path: '/shop' },
  { label: 'Season',       path: '/season' },
];
```

- [ ] **Step 3: Add Shop to `MOBILE_NAV` in `MainMenu.tsx`**

Find `MOBILE_NAV` (around line 249) and add Shop:

```typescript
const MOBILE_NAV = [
  { label: 'Leaderboard',  path: '/leaderboard' },
  { label: 'Achievements', path: '/achievements' },
  { label: 'Shop',         path: '/shop' },
  { label: 'Season',       path: '/season' },
];
```

- [ ] **Step 4: Add "Get more items" link to `CustomisePage.tsx`**

In `src/components/profile/CustomisePage.tsx`, find the empty state block (around line 199):
```typescript
{tabItems.length === 0 ? (
  <div style={{ color: tokens.textDim, textAlign: 'center', padding: 40, fontSize: 14 }}>
    {tab === 'emoji' ? 'No emoji unlocked yet.' : `No ${tab}s in your collection yet.`}
  </div>
) : (
  <div style={{ display: 'grid', ...
```

Replace with:
```typescript
{tabItems.length === 0 ? (
  <div style={{ textAlign: 'center', padding: 40 }}>
    <div style={{ color: tokens.textDim, fontSize: 14, marginBottom: 12 }}>
      {tab === 'emoji' ? 'No emoji unlocked yet.' : `No ${tab}s in your collection yet.`}
    </div>
    <button
      onClick={() => navigate('/shop')}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: tokens.accent, fontFamily: tokens.font,
        fontSize: 13, fontWeight: 700,
      }}
    >
      Get more items →
    </button>
  </div>
) : (
  <>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      {tabItems.map(item => {
        const equipped = isEquipped(item);
        return (
          <button
            key={item.item_id}
            onClick={() => handleSelect(item)}
            aria-pressed={equipped}
            style={{
              padding: 10, borderRadius: 14,
              cursor: tab === 'emoji' ? 'default' : 'pointer',
              border: 'none',
              background: equipped ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.04)',
              outline: equipped
                ? `1.5px solid ${tokens.accent}`
                : '1px solid rgba(255,255,255,0.06)',
              position: 'relative',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              fontFamily: tokens.font,
            }}
          >
            {equipped && (
              <div style={{
                position: 'absolute', top: 6, right: 6,
                padding: '2px 6px', borderRadius: 4,
                background: 'rgba(0,212,170,0.2)', fontSize: 8, fontWeight: 800,
                color: tokens.accent, letterSpacing: 0.6,
              }}>
                EQUIPPED
              </div>
            )}
            <ItemPreview item={item} />
            <span style={{ fontSize: 10, color: tokens.textMuted, textAlign: 'center', fontWeight: 600, lineHeight: 1.3 }}>
              {item.name}
            </span>
          </button>
        );
      })}
    </div>
    <div style={{ textAlign: 'center', marginTop: 16 }}>
      <button
        onClick={() => navigate('/shop')}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: tokens.accent, fontFamily: tokens.font,
          fontSize: 13, fontWeight: 700,
        }}
      >
        Get more items →
      </button>
    </div>
  </>
)}
```

- [ ] **Step 5: Add `/shop` to `TabBar` path map**

In `src/components/common/TabBar.tsx`, find `pathToTab` (line 19) and add the shop entry:

```typescript
const pathToTab: Record<string, TabId> = {
  '/menu':         'home',
  '/multiplayer':  'play',
  '/settings':     'settings',
  '/leaderboard':  'home',
  '/achievements': 'home',
  '/customise':    'profile',
  '/shop':         'home',   // ← add this line
};
```

Without this, visiting `/shop` on mobile highlights the "Home" tab via the fallback, which is fine functionally, but making it explicit keeps the map accurate.

- [ ] **Step 6: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```
Expected: no errors across all modified files.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/components/MainMenu.tsx src/components/profile/CustomisePage.tsx src/components/common/TabBar.tsx
git commit -m "feat: wire /shop route, MainMenu nav, CustomisePage link, TabBar map"
```

---

### Task 8: Smoke test

- [ ] **Step 1: Start the dev server**

```bash
npm start
```

- [ ] **Step 2: Log in and verify Shop appears in nav**

- Desktop: confirm "Shop" link in header nav
- Mobile: open hamburger menu, confirm "Shop" link in drawer

- [ ] **Step 3: Navigate to `/shop`**

- Confirm 4 tabs render (Avatar, Badge, Banner, Skins)
- Confirm credit balance shows in top-right chip
- Confirm items render in each tab (Avatar: 3 items, Badge: 3, Banner: 3, Skins: 4)
- Confirm items the player does not own show a price button
- Confirm items already owned (if any) show "Owned" pill

- [ ] **Step 4: Test a purchase**

- Find an item the player can afford
- Click "Buy [price]" button — confirm `PurchaseConfirmModal` opens
- Verify modal shows item name, cost, and projected balance
- Click "Cancel" — confirm modal closes without purchase
- Click "Buy" again, then "Buy" in modal — confirm:
  - Modal shows "Buying…" during RPC call
  - On success, modal closes, item flips to "Owned", credit balance updates
  - Check Supabase `player_inventory` and `transactions` tables confirm the purchase row

- [ ] **Step 5: Test insufficient credits edge case**

- If the player has fewer credits than a high-priced item, confirm the Buy button is greyed/disabled

- [ ] **Step 6: Verify "Get more items" link from `/customise`**

- Navigate to `/customise`
- Click "Get more items →" — confirm it navigates to `/shop`

- [ ] **Step 7: Final commit if any fixups were needed**

```bash
git add -p
git commit -m "fix: Phase 6 shop smoke test fixups"
```

---

## Post-implementation checklist

- [ ] `npx tsc --noEmit` passes with no errors
- [ ] `/shop` accessible to logged-in users; redirects guests to login
- [ ] All 13 paid items visible in correct tabs
- [ ] Purchase flow: confirm → RPC → owned pill + balance update
- [ ] "Get more items" link works from `/customise` (both empty and non-empty states)
- [ ] Shop nav item visible in MainMenu desktop header and mobile drawer
- [ ] Board/marker items go to inventory but do not affect the game board (no rendering change)
