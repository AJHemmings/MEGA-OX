# Phase 6 — Cash Shop Design

**Date:** 2026-05-29  
**Status:** Approved  
**Scope:** Credits-only in-app shop. No real money, no Stripe, no private API.

---

## Overview

A `/shop` page where players spend earned in-game credits on cosmetic items. Phase 6 covers the full purchase loop — catalogue display, credit deduction, inventory grant — but does **not** include in-game rendering of board/marker skins (deferred to a later phase) or real-money top-ups (Phase 7+).

---

## What is in scope

- `transactions` table + RLS
- `purchase_item` Postgres RPC (atomic: balance check → deduct → grant → log)
- Seed 13 paid cosmetic items across avatar, badge, banner, board, marker types
- RLS housekeeping on Phase 2 `user_skins` + `user_equipped_skins`
- `/shop` React page — tab bar, item grid, owned vs available states
- `useShop` and `usePurchase` hooks
- `ShopItemCard` and `PurchaseConfirmModal` components
- Shop nav item in `MainMenu`
- "Get more items" link in `CustomisePage`
- `/shop` route in `App.tsx` (ProtectedRoute)

## What is out of scope

- In-game rendering of board/marker skins
- Real-money top-ups (Stripe/PayPal)
- Private backend API
- Admin UI for adding items (Phase 7)

---

## Database

### Migration: `20260529000001_phase6_shop.sql`

#### 1. `transactions` — no migration needed

The `transactions` table already exists from the initial schema with this shape:
`(id, player_id, type, amount, item_id, stripe_payment_id, created_at)`.

The existing shape covers Phase 6 purchases: `type = 'purchase'`, `amount = credits_spent`, `item_id = purchased item`, `stripe_payment_id = NULL`.

RLS is also already enabled and a SELECT policy (`"Players can view their own transactions"`) already exists from `/20260316000001_rls_policies.sql`. **Do not add RLS or policies in the Phase 6 migration** — it would produce a duplicate policy.

The RPC inserts with: `type = 'purchase'`, `amount = v_price`, `item_id = p_item_id`, `stripe_payment_id = NULL`.

#### 2. `purchase_item` RPC

`SECURITY DEFINER` function — runs with elevated privileges to write `transactions` and update `currency_balance`.

Logic (single transaction):
1. Look up item price — return `item_not_found` if missing
2. Reject if `price IS NULL OR price = 0` — return `item_not_purchasable`
3. Check `player_inventory` — return `already_owned` if row exists
4. `SELECT coins INTO v_coins FROM currency_balance WHERE player_id = auth.uid() FOR UPDATE` — locks against concurrent purchases
5. Return `insufficient_credits` if `v_coins < v_price`
6. `UPDATE currency_balance SET coins = coins - v_price WHERE player_id = auth.uid()`
7. `INSERT INTO player_inventory (player_id, item_id, acquisition_source) VALUES (auth.uid(), p_item_id, 'purchased')`
8. `INSERT INTO transactions (player_id, type, amount, item_id) VALUES (auth.uid(), 'purchase', v_price, p_item_id)`
9. Return `jsonb_build_object('success', true, 'new_balance', v_coins - v_price)`

Return type: `JSONB` with shape `{ success: boolean, error?: string, new_balance?: integer }`.
Note: `new_balance` is the value of the `coins` column after deduction, aliased for the client.

#### 3. Paid cosmetic seed

All items: `source = 'shop'`, `rarity = 'common'` unless noted, `animated = false`.

| Type    | Name        | Price (cr) | Rarity   |
|---------|-------------|------------|----------|
| avatar  | Neon Teal   | 200        | common   |
| avatar  | Crimson     | 200        | common   |
| avatar  | Gold        | 500        | rare     |
| badge   | Veteran     | 150        | common   |
| badge   | Champion    | 300        | common   |
| badge   | Legend      | 500        | rare     |
| banner  | Sunset      | 200        | common   |
| banner  | Forest      | 200        | common   |
| banner  | Void        | 350        | common   |
| board   | Neon Grid   | 300        | common   |
| board   | Minimal     | 250        | common   |
| marker  | Neon Set    | 350        | common   |
| marker  | Pixel Set   | 300        | common   |

Board and marker items are inventory-only in Phase 6 — no in-game visual effect yet.

#### 4. Phase 2 RLS housekeeping

`user_skins` and `user_equipped_skins` have RLS enabled but the existing policy (`"Users manage own inventory"` / `"Users manage own equipped skins"`) uses no `FOR` clause — Postgres treats it as ALL operations, which is fine. The tables are accessible to the owning user already.

No policy changes needed. The handover note "needed before Phase 6" referred to these tables having no policies at all — Phase 2 actually added them. No action required in the Phase 6 migration.

---

## React Layer

### Hooks

#### `src/hooks/useShop.ts`

- Fetches `cosmetic_items` where `price > 0`
- Fetches `player_inventory` for `auth.uid()`
- Returns `catalogue: ShopItem[]` where each item has `owned: boolean` computed from inventory
- Returns `loading` and `error`
- Exposes `refetch()` — called by `usePurchase` on successful purchase

Balance is sourced from the existing `useProgression` hook — not duplicated here. The field is `useProgression().credits` (not `.balance`). `ShopPage` reads this and passes it as the `balance` prop to `ShopItemCard`.

#### `src/hooks/usePurchase.ts`

Signature: `usePurchase(onSuccess: () => void): { purchase: (itemId: string) => Promise<void>; purchasing: boolean; error: string | null }`

- Accepts `onSuccess: () => void` — caller (`ShopPage`) passes a callback that calls both `useShop().refetch()` and `useProgression().refresh()`
- Calls `supabase.rpc('purchase_item', { p_item_id: itemId })`
- Manages `purchasing: boolean` (single flag — disables **all** Buy buttons while any purchase is in flight, not per-item) and `error: string | null`
- On success: calls `onSuccess()` — `ShopPage` passes a callback that calls both `useShop().refetch()` AND `useProgression().refresh()`. `useProgression` has no realtime subscription; it only refetches on `refreshKey` change, so `refresh()` must be called explicitly to update the displayed balance after a purchase
- On RPC error strings (`insufficient_credits`, `already_owned`, etc.): surfaces user-friendly message via `error` state

### Components

#### `src/components/shop/ShopPage.tsx`

Route: `/shop` (ProtectedRoute)

Layout:
- `PageBackground` wrapper (Phase 5 shared component)
- Header row: "Shop" title + credits balance (from `useProgression`)
- `TabBar` with tabs: **Avatar | Badge | Banner | Skins**
  - Skins tab shows both `board` and `marker` type items
- Item grid below tab bar — renders `ShopItemCard` per item
- Empty state if no items in tab

#### `src/components/shop/ShopItemCard.tsx`

Props: `item: ShopItem`, `onBuy: () => void`, `purchasing: boolean`, `balance: number`

`purchasing` is a **global flag** from `usePurchase` — it disables the Buy button on every card while any purchase is in flight (not per-item). This is correct because `PurchaseConfirmModal` prevents two simultaneous purchases anyway.

States:
- **Available:** "Buy [price] cr" primary button — disabled + greyed if `balance < item.price` or `purchasing === true`
- **Owned:** "Owned" pill (teal, no button) — matches Phase 5 design tokens

#### `src/components/shop/PurchaseConfirmModal.tsx`

Fires before the RPC call. Content: item name, price, current balance, projected balance after purchase.
- **Confirm** → calls `usePurchase`
- **Cancel** → dismisses

Uses existing `Modal` component pattern from `GameWrapper`.

### Modified files

#### `src/components/MainMenu.tsx`

Add "Shop" as a nav item in both `DesktopLayout` and the mobile drawer (`MobileLayout`). Navigates to `/shop`.

#### `src/components/profile/CustomisePage.tsx`

Add "Get more items →" link below the item grid in each tab. Navigates to `/shop`.

#### `src/App.tsx`

Add `<Route path="/shop" element={<ShopPage />} />` **inside** the existing `<Route element={<ProtectedRoute />}>` layout route — the same pattern used for `/customise`, `/profile`, etc. `ProtectedRoute` renders `<Outlet />` not `{children}`, so wrapping it as a child element would produce a silently blank page.

---

## Data flow

```
ShopPage
  ├── useShop()          → reads cosmetic_items + player_inventory → catalogue[]
  ├── useProgression()   → reads currency_balance → balance (already used app-wide)
  └── ShopItemCard[]
        └── [Buy click] → PurchaseConfirmModal
              └── [Confirm] → usePurchase.rpc('purchase_item')
                    ├── success → useShop.refetch() + useProgression.refresh()
                    └── error   → inline error message on modal
```

---

## Error handling

| RPC error string      | User-facing message                          |
|-----------------------|----------------------------------------------|
| `item_not_found`      | "Item no longer available."                  |
| `item_not_purchasable`| "This item cannot be purchased."             |
| `already_owned`       | "You already own this item."                 |
| `insufficient_credits`| "Not enough credits."                        |
| (network/unknown)     | "Purchase failed. Please try again."         |

The Buy button is pre-disabled when `balance < price`, so `insufficient_credits` should only appear in a race (e.g. another tab purchased simultaneously).

---

## Key constraints

- Board and marker items are **inventory-only** in Phase 6 — no `CustomisePage` tab for them, no in-game visual change
- The shop is **authenticated only** — no guest access
- Item catalogue is managed via **migrations only** in Phase 6 — no admin UI until Phase 7
- `purchase_item` RPC is the **only write path** — clients cannot directly insert into `transactions` or modify `currency_balance`

---

## Files to create

| File | Purpose |
|------|---------|
| `supabase/migrations/20260529000001_phase6_shop.sql` | transactions table, purchase_item RPC, paid item seed, Phase 2 RLS fix |
| `src/hooks/useShop.ts` | catalogue + inventory fetch |
| `src/hooks/usePurchase.ts` | RPC call + state |
| `src/components/shop/ShopPage.tsx` | main shop page |
| `src/components/shop/ShopItemCard.tsx` | item tile |
| `src/components/shop/PurchaseConfirmModal.tsx` | confirm before buy |

## Files to modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add `/shop` route |
| `src/components/MainMenu.tsx` | Add Shop nav item (desktop + mobile) |
| `src/components/profile/CustomisePage.tsx` | Add "Get more items" link |
