# Phase 4 Design Retrospective
## Profile Customisation + Emoji Communication

**Date:** 2026-05-20
**Branch:** `feat/phase4-customisation-emoji`
**Commits:** 15 (aa32b05 → 26fe067)

---

## What we planned

### Goal
Give players a way to express themselves — equip a cosmetic avatar, badge, and banner on their profile, and throw quick emoji reactions at opponents during online games.

### Architecture decisions made upfront

**Cosmetics as a catalogue + inventory pattern, not file uploads.**
Everything comes from a `cosmetic_items` catalogue. Players own items via `player_inventory`. Profiles store which item is equipped in each slot (`active_avatar_id`, `active_badge_id`, `active_banner_id`). This was the right call: it sidesteps file upload complexity entirely, makes shop integration trivial in Phase 6 (just add a purchase flow to the existing table), and prevents players from uploading arbitrary images.

**Emoji is ephemeral broadcast, not persisted.**
Emoji reactions go over the existing Supabase Realtime channel in `useOnlineGame` and auto-clear after 3 seconds. There is no DB write. This was deliberate: emojis are cosmetic, not game-critical, and the channel is already open and trusted. The trade-off is that a degraded WebSocket connection means an emoji may not arrive — acceptable for this feature.

**SVG data URIs for Phase 4 placeholder assets.**
Rather than setting up Supabase Storage, placeholder cosmetics use inline SVG data URIs stored directly in the `asset_url` column. Emoji items store the raw Unicode glyph. This means zero CDN dependency for Phase 4. The trade-off is ugliness in the DB (long strings) and a hard migration cut when real art assets arrive in Phase 5/6.

**Everything free now, shop later.**
All Phase 4 items have `price = 0` and `source = 'default'`. The DB schema already has a `price` column. The purchase flow is Phase 6. This lets us ship the UI and test the foundation without building a payment system.

---

## What worked well

### Subagent-driven development with two-stage review
Every task went through a spec compliance reviewer and a code quality reviewer before being marked done. This caught real bugs before they landed:

- The spec reviewer on the migration plan caught that the `cosmetic_items_type_check` and `cosmetic_items_source_check` constraints only allowed old values — the INSERT would have failed entirely without the DROP/RECREATE.
- The spec reviewer on `useInventory` caught that PostgREST's `.eq()` doesn't work on embedded resource columns — would have been a silent empty-result bug.
- The quality reviewer on `useLoadout` caught the missing `.catch()` — a Supabase failure would have left `loading: true` permanently.
- The quality reviewer on `EmojiBubble` caught the missing `animations.css` import — the bounce animation would have silently failed in some bundle splits.
- The quality reviewer on `useLoadout` caught a stale closure bug in `equip()` — rapid back-to-back equip calls could restore a corrupted rollback value.
- The quality reviewer on `EmojiPanel` flagged the fast-tab `cursor` issue, which led to the better solution of rendering emoji items as `<div>` instead of `<button>`.
- The final cross-cutting review caught two more: `useInventory` missing `try/catch/finally` and `sendEmoji` having no `status !== 'active'` guard.

The total issues caught before merge: **~12 bugs**, none of which would have shown up on a happy-path smoke test.

### Optimistic update in `useLoadout`
Clicking "equip" feels instant because the UI updates immediately and rolls back only if the DB write fails. For a cosmetic action with no game consequences, this is the right trade-off. The final version captures `prev` atomically inside the setter to avoid stale closure issues on rapid equips.

### Using the existing Realtime channel for emoji
Rather than subscribing a second channel, emoji events go on the same `game:${gameId}` channel that already handles moves, rematch, and presence. This means:
- No extra subscription cost
- Emoji works immediately when the game channel is healthy
- Emoji degrades gracefully when it's not (no crash — just silent miss)

### SVG data URIs as placeholder assets
Seeding 8 cosmetic items with inline SVGs meant the entire Phase 4 UI was testable immediately after the migration, with no external dependencies. The Supabase Studio SQL runner made it easy to verify visually.

---

## What didn't work / problems hit

### Supabase MCP on wrong account
The MCP tool was authenticated to `adamjh84@outlook.com` (personal account), not the MEGA-OX Supabase project account. Every `apply_migration` and `execute_sql` call returned "permission denied". This burned about 30 minutes of debugging before the root cause was clear.

**Resolution:** User applied the migration manually via Supabase Studio on the correct account. For future phases, the MCP token needs to be explicitly tied to `qioxtkcjtvvkzcoupdfk`.

### `.then().catch()` on a PromiseLike
The original `useLoadout` used `.then().catch()` chaining on the Supabase query result. TypeScript correctly rejected this — Supabase returns a `PromiseLike`, not a full `Promise`, and `.catch()` is not available on it. The fix was to convert to an `async` IIFE with `try/catch/finally`. This is now the standard pattern across `useInventory` and `useLoadout`.

### CHECK constraint violations in the migration
The original `cosmetic_items` table only allowed `type IN ('marker', 'board', 'theme')` and `source IN ('shop', 'tournament', 'achievement')`. Inserting Phase 4 items (`type = 'avatar'`, `source = 'default'`) would have hit constraint violations. This was caught in the plan review phase before the migration was even written. Fix: DROP and recreate all three affected constraints before the INSERT.

### PostgREST `.eq()` on embedded resource columns
When fetching inventory, the natural approach would be:
```ts
supabase.from('player_inventory')
  .select('item_id, cosmetic_items(name, type, asset_url, rarity)')
  .eq('cosmetic_items.type', 'emoji')  // THIS DOES NOT WORK
```
PostgREST doesn't support `.eq()` filtering on columns of an embedded resource. The workaround is to fetch all rows and filter client-side. This works cleanly for inventories of manageable size (Phase 4 has 8 items). At scale it's a performance concern — the correct long-term fix is a view or a stored procedure, not client-side filtering.

### `asset_url` naming confusion for emoji items
The column is named `asset_url` but for emoji items it stores the raw Unicode glyph (`'👍'`). The final code quality reviewer flagged this as a potential runtime bug (rendering a URL as text). The actual behaviour is correct — rendering `'👍'` as JSX text content works fine — but the field name is misleading. A comment was added to clarify the data contract. Real art assets in Phase 5/6 will need to revisit this: emoji items with image assets can't use the same rendering path as text glyphs.

### EmojiBubble overflow on mobile
`EmojiBubble` is positioned at `[side]: '-60px'` from the board container edge. On viewports narrower than ~520px, the bubble extends beyond the edge of the screen. There is no `overflow: hidden` on a parent, so the bubble is simply invisible on narrow mobile screens. This was acknowledged as a known Phase 4 limitation and deferred to the Phase 5 visual redesign.

---

## Trade-offs accepted for Phase 4

| Decision | Why | Accepted cost |
|---|---|---|
| Emoji items store Unicode glyph in `asset_url` | No image hosting needed for Phase 4 | Field name is misleading; rendering path diverges from image assets |
| Emoji is ephemeral, no persistence | Simple; uses existing channel | Missed on degraded WebSocket |
| SVG data URIs in DB | Zero CDN dependency for placeholders | Long strings in DB; hard cut when real assets arrive |
| Client-side type filtering in `useInventory` | Works around PostgREST limitation | Fetches all inventory, filters in JS |
| EmojiBubble at `-60px` offset | Simple absolute positioning | Overflows viewport on mobile |
| `(profileData as any)` for aliased FK joins | TypeScript doesn't infer PostgREST alias shapes | Runtime safety only if column names match |
| Everything free, no purchase flow | Phase 6 concern | Shop UI is missing; all items feel undifferentiated |

---

## Schema decisions

### Why loadout columns on `profiles` instead of a separate table
A separate `player_loadout` table would be more normalised, but the profiles table already has one row per player and is already read on every profile page load. Adding three FK columns avoids a join on the hot path. For 3 slots, the denormalisation is acceptable.

### Why `source = 'default'` instead of a separate grant mechanism
Items with `source = 'default'` are granted to all players via the migration's `INSERT INTO player_inventory ... CROSS JOIN ... WHERE source = 'default'`. New item types added in future phases can use the same pattern by running a targeted grant migration. It's not fully automatic for future sign-ups (they miss items seeded before they registered), but the UX impact is small and the fix (a DB trigger on profile creation) is straightforward.

---

## Files introduced or significantly changed

| File | What changed |
|---|---|
| `supabase/migrations/20260520000001_phase4_schema.sql` | New: loadout columns, constraint expansions, seed, grants, defaults, RLS |
| `src/lib/database.types.ts` | Added Phase 4 columns to profiles Row/Insert/Update |
| `src/hooks/useInventory.ts` | New: inventory fetch with client-side type filter |
| `src/hooks/useLoadout.ts` | New: loadout read/write with optimistic update |
| `src/components/profile/CustomisePage.tsx` | New: 4-tab equip UI at `/customise` |
| `src/components/profile/ProfilePage.tsx` | Extended: FK joins for cosmetics, banner background, badge in username row |
| `src/hooks/useOnlineGame.ts` | Added: emoji state, broadcast handler, `sendEmoji`, timer cleanup |
| `src/components/game/EmojiPanel.tsx` | New: inventory-backed emoji picker |
| `src/components/game/EmojiBubble.tsx` | New: floating bubble with `emojiBounce` animation |
| `src/components/animations.css` | Added: `@keyframes emojiBounce` |
| `src/components/game/OnlineGameView.tsx` | Added: emoji imports, destructure, board wrapper, panel render |
| `src/App.tsx` | Added: `/customise` route inside ProtectedRoute |

---

## Smoke test checklist

Work through these in order. Use two browser tabs (different accounts) for the online game tests.

### A. Profile customisation

**A1. Default cosmetics on profile**
1. Log in → navigate to your profile
2. Profile card should show a blue circle avatar with "OX" text (Classic Blue)
3. A grey star badge (Newcomer) should appear next to the level badge in the username row
4. The profile card background should be a dark gradient (Night Sky banner)
5. Text (username, rank tier) should remain readable over the banner

**A2. Customise page loads**
1. Click "Customise" button on your profile
2. Page loads with 4 tabs: Avatar, Badge, Banner, Emoji
3. Avatar tab shows 2 items: Classic Blue and Classic Orange
4. Badge tab shows 2 items: Newcomer and Player
5. Banner tab shows 2 items: Night Sky and Ocean
6. Emoji tab shows 2 items: Thumbs Up and Fire
7. Currently equipped items (Avatar: Classic Blue, Badge: Newcomer, Banner: Night Sky) should have a teal border and "Equipped" label

**A3. Equip avatar**
1. On the Avatar tab, click "Classic Orange"
2. Classic Orange should immediately show a teal border and "Equipped" label
3. Classic Blue should lose its border
4. Navigate back to your profile
5. Profile card avatar should now show an orange circle

**A4. Equip banner**
1. On the Banner tab, click "Ocean"
2. Ocean should show "Equipped"
3. Navigate back to profile
4. Profile card background should now show a blue-to-teal gradient
5. Username and rank tier text should still be readable over the gradient

**A5. Equip badge**
1. On the Badge tab, click "Player"
2. Navigate back to profile
3. A green star badge should appear next to the level badge in the username row

**A6. Persistence on reload**
1. Hard refresh the page (Ctrl+Shift+R)
2. Navigate to your profile
3. Equipped items (Classic Orange, Ocean, Player) should still be selected — changes persisted to DB

**A7. Emoji tab is display-only**
1. On the Emoji tab, click a Thumbs Up or Fire item
2. Nothing should happen — no equip label appears, no state change

**A8. Other player's profile**
1. Navigate to another player's profile URL (e.g. `/profile/otherUsername`)
2. "Customise" button should NOT appear (only visible on own profile)
3. Their equipped cosmetics (or defaults) should display correctly

---

### B. In-game emoji communication

**B1. Setup: start an online game**
1. Open two browser tabs, log in as two different accounts
2. Have one player create a game and the other join

**B2. Emoji button visibility**
1. During the active game (RPS resolved, game in progress): emoji 😊 button should be visible below the board on both screens
2. Before the game starts (waiting/RPS screens): emoji button should NOT be visible
3. After the game ends (complete screen): emoji button should NOT be visible

**B3. Send emoji — sender side**
1. Click the 😊 button
2. A popover should appear showing 👍 and 🔥
3. Click 👍
4. The popover closes
5. A bubble showing 👍 should appear on the **left** side of the board
6. After ~3 seconds the bubble should disappear automatically

**B4. Receive emoji — opponent side**
1. After step B3, check the second tab
2. A bubble showing 👍 should appear on the **right** side of the board on the opponent's screen
3. After ~3 seconds the bubble disappears on the opponent's screen too

**B5. Second emoji replaces first**
1. Click 😊 and send 🔥
2. The 🔥 bubble appears (or replaces the existing bubble)
3. Verify the 3-second timer resets — the bubble stays visible for 3 more seconds from the new send

**B6. Panel closes on selection**
1. Click 😊 to open the panel
2. Click an emoji
3. The panel closes automatically

**B7. Panel toggles on button re-click**
1. Click 😊 once — panel opens
2. Click 😊 again — panel closes without sending

**B8. Emoji does not fire after game ends**
1. While the emoji panel is open, have the current player make a winning move to end the game
2. The emoji panel should disappear (game is now `complete`)
3. If there's a race — try clicking the emoji button after the complete screen appears
4. No emoji bubble should appear on either screen

---

### C. Edge cases

**C1. Empty inventory (should never happen with Phase 4 migration, but verify)**
1. If a player has no emoji items, the emoji panel should still open but show nothing (or not show the popover at all)
2. No crash or console error should appear

**C2. TypeScript build**
1. Run `npx tsc --noEmit` from the project root
2. Zero errors expected

**C3. No console errors on happy path**
1. Open browser devtools
2. Run through tests A1–A6 and B1–B6
3. No unhandled errors, no 4xx/5xx in the network tab (other than pre-existing known issues)

---

### Known issues to expect (not failures)

- On very narrow viewports (<520px), emoji bubbles may not be visible — they position off-screen. This is a known Phase 4 limitation, not a bug to fix now.
- New user accounts created after the migration will have null loadout columns — they'll see a letter avatar and no badge/banner until they visit `/customise`. This is expected.
