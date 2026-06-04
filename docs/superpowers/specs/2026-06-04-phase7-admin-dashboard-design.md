# Phase 7 — Admin Dashboard Design

**Date:** 2026-06-04
**Status:** Approved
**Scope:** Protected admin area for managing game content, shop, and AI difficulty — no separate API server.

---

## Overview

A `/admin` area accessible only to users with an admin role. Two tiers of access: `super_admin` (full access) and `editor` (content management only). All writes go directly to Supabase via RLS-protected tables — no private API needed for Phase 7.

---

## Roles

| Role | Access |
|---|---|
| `editor` | Skins, Achievements, Emojis |
| `super_admin` | Everything — including Shop, Transaction History, AI Tuner |

Roles stored in a new `admin_roles` table. A user with no row is not an admin and cannot access `/admin`.

---

## Database

### New table: `admin_roles`

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
role        text NOT NULL CHECK (role IN ('super_admin', 'editor'))
created_at  timestamptz NOT NULL DEFAULT now()
UNIQUE (user_id)
```

RLS (two separate SELECT policies required):
- `admin_roles_self_read` — `user_id = auth.uid()` — every admin can read their own row (required so `useAdminRole` can determine the current user's role)
- `admin_roles_super_read` — `EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid() AND role = 'super_admin')` — super admins can read all rows
- INSERT/DELETE: `EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid() AND role = 'super_admin')`

### New table: `ai_config`

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
difficulty  text NOT NULL CHECK (difficulty IN ('medium', 'hard'))
rule_name   text NOT NULL
strength    integer NOT NULL CHECK (strength >= 0 AND strength <= 100)
updated_at  timestamptz NOT NULL DEFAULT now()
updated_by  uuid REFERENCES profiles(id)
UNIQUE (difficulty, rule_name)
```

Seeded with current hardcoded AI values. Rules must map 1:1 to the exported constants in `src/ai/aiPlayer.ts`:

| difficulty | rule_name | seed value | maps to constant |
|---|---|---|---|
| medium | win_rule_strength | 80 | `MEDIUM_WIN_RULE_STRENGTH` |
| medium | poison_filter_strength | 70 | `MEDIUM_POISON_RULE_STRENGTH` |
| hard | win_rule_strength | 95 | `HARD_WIN_RULE_STRENGTH` |
| hard | poison_filter_strength | 90 | `HARD_POISON_RULE_STRENGTH` |
| hard | minimax_depth | 3 | `HARD_MINIMAX_DEPTH` |

`minimax_depth` is an integer (1–5), not a 0–100 strength value. Its slider in the AI Tuner UI should have range 1–5 and display as a step slider, not a percentage.

The `strength` column CHECK `(strength >= 0 AND strength <= 100)` applies to all rows. Add a second row-level constraint specifically for `minimax_depth`:
```sql
CONSTRAINT ai_config_minimax_depth_range
  CHECK (rule_name <> 'minimax_depth' OR (strength >= 1 AND strength <= 5))
```
This tightens the valid range for the depth row without changing the schema for strength rows.

RLS:
- SELECT: public (AI reads config at game start)
- INSERT/UPDATE: `EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid() AND role = 'super_admin')`

### Modified tables

**`cosmetic_items`** — three new columns:
- `visible boolean NOT NULL DEFAULT true` — hides item from shop without archiving
- `featured boolean NOT NULL DEFAULT false` — marks item as featured in shop UI
- `archived boolean NOT NULL DEFAULT false` — soft-delete; archived items are excluded from the public shop query and shown dimmed in the admin table

RLS additions:
- INSERT/UPDATE/DELETE on `cosmetic_items`: allowed if user has a row in `admin_roles` with `role IN ('super_admin', 'editor')`

**`achievements`** — RLS additions:
- INSERT/UPDATE/DELETE: allowed if user has row in `admin_roles` with `role IN ('super_admin', 'editor')`

**`transactions`** — RLS additions:
- SELECT all rows: allowed if `admin_roles.role = 'super_admin'` (existing policy allows players to see their own rows only)

### Supabase Storage

New public bucket: `admin-assets`. Used for skin/emoji asset uploads from the admin panel. Uploaded files are served at a stable public URL stored in `cosmetic_items.asset_url`.

Upload policy: authenticated users with an `admin_roles` row may upload. File size limit: 2MB. Accepted types: SVG, PNG, JSON (Lottie).

### Migration file

`supabase/migrations/20260604000001_phase7_admin.sql`

---

## React Layer

### Hook: `useAdminRole`

```ts
useAdminRole(): { role: 'super_admin' | 'editor' | null; loading: boolean }
```

Fetches the current user's row from `admin_roles`. Returns `null` if no row exists. Cached for the session — no realtime subscription needed.

### Route wrapper: `AdminRoute`

Props: `requiredRole?: 'super_admin'`

- While `loading === true` → render a neutral loading state (e.g. `PageBackground` with a spinner), never redirect during loading
- If `role === null` and `loading === false` → redirect to `/menu`
- If `requiredRole === 'super_admin'` and `role === 'editor'` → redirect to `/admin/skins`
- Otherwise → render children

### Layout: `AdminLayout`

Persistent sidebar + content area. Sidebar renders section links conditionally:

```
Skins          → /admin/skins        (editor+)
Achievements   → /admin/achievements  (editor+)
Emojis         → /admin/emojis       (editor+)
───────────────
Shop           → /admin/shop          (super_admin only)
AI Tuner       → /admin/ai-tuner      (super_admin only)
```

Divider between editor and super_admin sections. Super-admin-only links hidden from editors entirely.

### Routes in `App.tsx`

Added inside the existing `<Route element={<ProtectedRoute />}>` block:

```tsx
<Route path="/admin"              element={<Navigate to="/admin/skins" replace />} />
<Route path="/admin/skins"        element={<AdminRoute><AdminLayout><SkinsManager /></AdminLayout></AdminRoute>} />
<Route path="/admin/achievements" element={<AdminRoute><AdminLayout><AchievementsManager /></AdminLayout></AdminRoute>} />
<Route path="/admin/emojis"       element={<AdminRoute><AdminLayout><EmojiManager /></AdminLayout></AdminRoute>} />
<Route path="/admin/shop"         element={<AdminRoute requiredRole="super_admin"><AdminLayout><ShopManager /></AdminLayout></AdminRoute>} />
<Route path="/admin/ai-tuner"     element={<AdminRoute requiredRole="super_admin"><AdminLayout><AiTuner /></AdminLayout></AdminRoute>} />
```

---

## Content Manager Pattern

Skins, Achievements, and Emojis all share the same layout pattern. Emojis are `cosmetic_items` filtered by `type = 'emoji'` — same component as Skins, different filter.

### Layout

- **Header row:** section title + item count + "Add Item" button (teal pill)
- **Filter tabs:** type-based (Skins: All / Avatar / Badge / Banner / Board / Marker)
- **Table:** preview thumbnail, name, type, price, rarity, Edit + Archive actions
- **Archived rows:** shown dimmed with strikethrough, action changes to "Restore"

### Add / Edit modal

Triggered by "Add Item" button or "Edit" row action. Opens as a centred overlay — same modal pattern as `GameWrapper`. Background dims, click outside to cancel.

**Form fields (Skins & Emojis):**
- Name (text input)
- Type (select: avatar / badge / banner / board / marker / emoji)
- Price in credits (number input — 0 = free)
- Rarity (select: common / rare / epic / legendary)
- Animated (boolean toggle)
- Asset (file upload → Supabase Storage → fills `asset_url`; preview renders after upload)

**Form fields (Achievements):**
- Name (text input)
- Description (textarea)
- Condition type (select: `wins`, `games_played`, `win_streak`, `draws`, `losses`)
- Condition value (number — threshold to trigger)
- XP reward (number)
- Credit reward (number)

**Asset upload flow:**
1. Admin clicks "Choose file" or drags file onto the upload zone
2. File uploads to `admin-assets` Supabase Storage bucket
3. On success, `asset_url` field fills with the public URL
4. Preview renders the asset inline below the upload zone
5. Save stores the URL to `cosmetic_items.asset_url`

### Archive vs delete

Items are soft-deleted (`archived: boolean` column added to `cosmetic_items`). This preserves existing `player_inventory` rows — a player who owns an archived item still has it. Archived items are hidden from the shop but remain in the database.

---

## Shop Manager (super_admin)

Two tabs:

**Items tab:**
Table of all `cosmetic_items` where `source = 'shop'`. Columns: preview, name, type, price, visible toggle, featured toggle. Inline toggles — no modal needed. Price is editable inline (click to edit, enter to save).

**Transactions tab:**
Searchable list of all rows in `transactions` where `type = 'purchase'`. Columns: player username, item name, amount (credits), date. Sorted by date descending. Search by username or item name. Read-only.

---

## AI Tuner (super_admin)

### Layout

- Header: title + "Save Changes" button (disabled until a slider is moved; unsaved indicator appears)
- Medium / Hard tab switcher (independent values per difficulty)
- Rule cards at `max-width: 340px` — left-aligned in the content panel

### Rule card

Each card: rule name, plain-English description, 0–100 slider, live numeric readout.
- 0 = AI ignores this rule (random move)
- 100 = AI always follows this rule

### Rules

Only rules that exist in `src/ai/aiPlayer.ts` are exposed. Three rules total:

| Rule | Applies to | UI control | Description |
|---|---|---|---|
| `win_rule_strength` | Medium, Hard | 0–100 slider | Probability the AI takes a winning micro-board move |
| `poison_filter_strength` | Medium, Hard | 0–100 slider | Probability the AI avoids sending opponent to a board they can immediately win |
| `minimax_depth` | Hard only | 1–5 step slider | How many moves ahead the minimax looks (higher = harder, slower) |

Medium tab shows 2 sliders. Hard tab shows 3 sliders.

### Save behaviour

"Save Changes" writes all rule values for the active difficulty to `ai_config` in a single batch upsert. The AI reads from `ai_config` at game start via `useAiConfig` hook — replacing the current hardcoded constants.

---

## Files to Create

| File | Purpose |
|---|---|
| `supabase/migrations/20260604000001_phase7_admin.sql` | `admin_roles`, `ai_config` tables; `visible`/`featured` columns on `cosmetic_items`; `archived` column; all RLS policies |
| `src/hooks/useAdminRole.ts` | Fetch current user's admin role. Note: `AdminRoute` assumes the user is already authenticated (nested inside `ProtectedRoute`) — this hook only checks role, not auth state. |
| `src/hooks/useAdminItems.ts` | Fetch + mutate `cosmetic_items` (add, edit, archive, restore) |
| `src/hooks/useAdminAchievements.ts` | Fetch + mutate `achievements` |
| `src/hooks/useAiConfig.ts` | Fetch `ai_config` (used by game AI); admin also uses this to read current values |
| `src/hooks/useAdminTransactions.ts` | Fetch all `transactions` rows where `type = 'purchase'`, joined with `profiles` (username) and `cosmetic_items` (name); returns paginated, searchable list for the ShopManager Transactions tab |
| `src/components/admin/AdminRoute.tsx` | Role-based route guard |
| `src/components/admin/AdminLayout.tsx` | Sidebar + content shell |
| `src/components/admin/shared/ContentTable.tsx` | Reusable table: rows, archive/restore, filter tabs |
| `src/components/admin/shared/ItemFormModal.tsx` | Reusable add/edit modal with asset upload |
| `src/components/admin/shared/AssetUpload.tsx` | Upload zone → Supabase Storage → preview |
| `src/components/admin/SkinsManager.tsx` | Skins section |
| `src/components/admin/EmojiManager.tsx` | Emojis section (filtered Skins view) |
| `src/components/admin/AchievementsManager.tsx` | Achievements section |
| `src/components/admin/ShopManager.tsx` | Shop items + transactions (super_admin) |
| `src/components/admin/AiTuner.tsx` | AI difficulty sliders (super_admin) |

## Files to Modify

| File | Change |
|---|---|
| `src/App.tsx` | Add `/admin/*` routes inside `ProtectedRoute` block |
| `src/components/MainMenu.tsx` | Add "Admin" link in desktop + mobile nav — only rendered if `useAdminRole` returns non-null |
| `src/ai/aiPlayer.ts` | Replace hardcoded `MEDIUM_WIN_RULE_STRENGTH`, `MEDIUM_POISON_RULE_STRENGTH`, `HARD_WIN_RULE_STRENGTH`, `HARD_POISON_RULE_STRENGTH`, `HARD_MINIMAX_DEPTH` constants with values passed in as parameters; callers read from `ai_config` via `useAiConfig` |
| `src/hooks/useShop.ts` | Add `.eq('archived', false)` filter to the `cosmetic_items` query so archived items do not appear in the shop. Also verify the `ShopItem.type` field is typed as `string` (not a narrowed union) so no TypeScript changes are needed when new item types are introduced. |
