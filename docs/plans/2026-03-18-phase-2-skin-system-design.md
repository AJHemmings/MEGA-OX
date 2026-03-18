# Phase 2 — Skin System Design

## Scope

Phase 2 expands the original "code refactor only" brief to include:

1. Skin system architecture (code refactor — no art)
2. RPS mini-game for turn order determination
3. Supabase schema for skins and inventory

Visual art direction and real Lottie assets are deferred to Phase 5.

---

## Skin types

There are five independent skin slots, each a separate purchasable product:

| Type | Description |
|---|---|
| `board` | Board background + grid |
| `marker_x` | X marker (used when player is Player 1) |
| `marker_o` | O marker (used when player is Player 2) |
| `won_board_x` | Won-board overlay when X claims a micro board |
| `won_board_o` | Won-board overlay when O claims a micro board |

Skins are typed — a `marker_o` skin cannot be equipped in the `marker_x` slot. The shop filters by type automatically.

Marker skins are symbol-agnostic. They do not have to be X or O — they can be a flame, skull, emoji, or anything else. The game tracks ownership by player, not by symbol shape.

---

## Bundles

A bundle is a named themed set containing multiple skins sold together at a discount. Purchasing a bundle inserts each individual skin into the buyer's inventory. Bundles are a shop concept — the inventory model has no special bundle structure.

---

## In-game skin assignment

Turn order is determined by RPS (see below). Once resolved:

| Slot | Source |
|---|---|
| Board background + grid | Player 2's `board` skin |
| Player 1 marker | Player 1's `marker_x` skin |
| Player 2 marker | Player 2's `marker_o` skin |
| Player 1 won-board overlay | Player 1's `won_board_x` skin |
| Player 2 won-board overlay | Player 2's `won_board_o` skin |

Both players see the same board (Player 2's board skin) and can distinguish each player's markers by style.

**Single player vs AI:** No RPS. Human is always Player 1 (X). AI is always Player 2 (O). Human's board skin is used. AI markers use the default placeholder skin.

---

## Section 1 — Skin data model and resolver

```ts
type SkinType = 'board' | 'marker_x' | 'marker_o' | 'won_board_x' | 'won_board_o'

type Skin = {
  id: string
  name: string
  type: SkinType
  assetUrl: string
}
```

A skin registry maps `skinId → Skin`. In Phase 2 this is a local constant file. In Phase 6 it resolves URLs from Supabase Storage — components never change.

**User equipped skins (5 slots):**
```ts
{
  board_skin_id: string | null
  marker_x_skin_id: string | null
  marker_o_skin_id: string | null
  won_board_x_skin_id: string | null
  won_board_o_skin_id: string | null
}
```

Null in any slot resolves to the default placeholder skin.

**Game skin resolver:** given P1 and P2's equipped skins, produces:
```ts
type GameSkins = {
  boardSkin: Skin
  p1MarkerSkin: Skin
  p2MarkerSkin: Skin
  p1WonBoardSkin: Skin
  p2WonBoardSkin: Skin
}
```

In Phase 2 all slots return the placeholder skin. In Phase 6 the resolver checks `user_skins` to verify ownership before resolving — unowned skins fall back to default.

---

## Section 2 — SkinContext and component architecture

`SkinContext` sits at `GameWrapper` level and holds the resolved `GameSkins` object. All skin components read from context — no prop drilling.

**Three new skin components:**

`<BoardSkin>` — sits behind `MacroBoard`. Renders the board background + grid as a Lottie ambient loop. Replaces the current CSS grid background.

`<MarkerSkin player={1|2}>` — sits inside each `Cell`. Renders the player's marker Lottie. Empty cells render nothing. Replaces the current `{value}` string.

`<WonBoardSkin player={1|2}>` — overlaid on a won `MicroBoard`. Renders the won-board overlay Lottie. Replaces the current background colour + "Winner: X" text.

**Changes to existing components:**

| File | Change |
|---|---|
| `Cell.tsx` | Replace `{value}` with `<MarkerSkin player={...}>` |
| `MicroBoard.tsx` | Add `<WonBoardSkin>` overlay, remove colour change and winner text |
| `MacroBoard.tsx` | Wrap with `<BoardSkin>` |

---

## Section 3 — RPS mini-game

Runs before every multiplayer game to determine turn order.

**Network multiplayer flow:**
1. Both players land on the RPS screen simultaneously
2. Each player picks rock, paper, or scissors — picks are hidden until both are submitted via Supabase Realtime
3. Simultaneous reveal — winner becomes Player 1 (X, goes first), loser becomes Player 2 (O, owns the board)
4. On a draw, both re-pick
5. Result screen — both players see who goes first, whose board skin is in play, and the full marker assignment before the game starts
6. Game starts

**Local 2-player flow:**
1. One "Rock Paper Scissors" button on screen
2. Button randomly assigns picks for both players
3. Result screen shows outcome and skin assignment
4. Game starts

**Single player:** No RPS, no result screen. Game starts immediately.

**P1/P2 assignment** is written to the `game_sessions` row. Both clients read from it as the source of truth for turn order and skin resolution.

---

## Section 4 — Lottie integration and animation interface

**Library:** `lottie-react`

Each skin component holds a Lottie player ref and calls `playSegments()` in a `useEffect` when a `currentEvent` prop changes.

**Segment contract — every Lottie skin file must include these named segments:**

| Segment | Trigger |
|---|---|
| `ambient` | All types — loops continuously at rest |
| `marker_placed` | `MarkerSkin` — plays on placement |
| `board_won` | `WonBoardSkin` — plays when board is claimed |
| `board_targeted` | `BoardSkin` — pulses the targeted micro board (constraint rule) |
| `game_won` | All — celebration |
| `game_drawn` | All — subdued end |

**Dimensions:** left loose in Phase 2. Skins scale to fit their container via CSS. Exact pixel dimensions and aspect ratios are locked down in Phase 5 when the board geometry is finalised.

**Phase 2 placeholder skin:** a static Lottie stub with no real animation — current styled X/O rendered through the new component structure. All segment hooks are present but do nothing. Dropping in real Lottie files in Phase 5 requires zero code changes.

---

## Section 5 — Supabase schema

**New table: `skins`**
```sql
id          uuid primary key
name        text
type        text  -- 'board' | 'marker_x' | 'marker_o' | 'won_board_x' | 'won_board_o'
asset_url   text
price       integer  -- null until Phase 6
created_at  timestamptz
```

**New table: `user_skins`** (inventory)
```sql
user_id     uuid references auth.users
skin_id     uuid references skins
acquired_at timestamptz
primary key (user_id, skin_id)
```

**New table: `user_equipped_skins`**
```sql
user_id             uuid references auth.users primary key
board_skin_id       uuid references skins  -- nullable
marker_x_skin_id    uuid references skins  -- nullable
marker_o_skin_id    uuid references skins  -- nullable
won_board_x_skin_id uuid references skins  -- nullable
won_board_o_skin_id uuid references skins  -- nullable
```

Null in any slot resolves to the default placeholder skin on the client.

**Existing table: `game_sessions`** — add:
```sql
p1_user_id  uuid references auth.users
p2_user_id  uuid references auth.users
```

RPS result writes P1/P2 assignment here. Both clients read it as the source of truth.

**Deferred to Phase 6:** `skin_bundles` and `skin_bundle_items` tables. Inventory model already supports bundle purchases — buying a bundle inserts individual rows into `user_skins`.

---

## What is NOT in Phase 2

- Real Lottie animation files (Phase 5)
- Board visual redesign (Phase 5)
- Skin browsing / equip UI (Phase 3 or 4 — TBD)
- Purchase flow and virtual currency (Phase 6)
- Supabase Storage integration for asset hosting (Phase 6)
- Bundle shop structure (Phase 6)
- Asset dimension spec for skin artists (Phase 5)
